import type { TubeStats } from 'beanstalkd-ts';
import { container } from 'tsyringe';
import z from 'zod';
import injectionTokens from './injection-tokens';
import { publicProcedure, router } from './trpc';

export interface TubeWithStats {
  name: string;
  stats: TubeStats;
}

function servers() {
  return container.resolve(injectionTokens.beanstalkdServers);
}

function getServer(id: number) {
  const server = servers().find((s) => s.id === id);

  if (!server) throw new Error(`Server${id} not found.`);

  return server;
}

export const appRouter = router({
  servers: {
    list: publicProcedure.query(async () => servers()),
  },
  tubes: {
    pause: publicProcedure
      .input(
        z.object({ serverId: z.int(), tube: z.string(), seconds: z.int() }),
      )
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);

        await server.bsClient.pauseTube(opts.input.tube, opts.input.seconds);

        return 'ok';
      }),
    list: publicProcedure
      .input(z.object({ serverId: z.int() }))
      .query(async (opts) => {
        const server = getServer(opts.input.serverId);
        const tubes = await server.bsClient.listTubes();
        const tubeStats: TubeStats[] = [];

        for (const tube of tubes) {
          tubeStats.push(await server.bsClient.statsTube(tube));
        }

        return tubes.map(
          (tube, i) =>
            ({ name: tube, stats: tubeStats[i] }) satisfies TubeWithStats,
        );
      }),
  },
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
