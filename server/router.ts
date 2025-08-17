import { type JobStats, NotFoundError, type TubeStats } from 'beanstalkd-ts';
import { container } from 'tsyringe';
import z from 'zod';
import injectionTokens from './injection-tokens';
import { publicProcedure, router } from './trpc';

export interface TubeWithStats {
  name: string;
  stats: TubeStats;
}

export interface JobWitStats {
  job: { id: number; payload: string };
  stats: JobStats;
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
  jobs: {
    peekBuried: jobStatsProcedure('peekBuried'),
    peekDelayed: jobStatsProcedure('peekDelayed'),
    peekReady: jobStatsProcedure('peekReady'),
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
        const tubeStats = await Promise.all(
          tubes.map((tube) => server.bsClient.statsTube(tube)),
        );

        return tubes.map(
          (tube, i) =>
            ({ name: tube, stats: tubeStats[i] }) satisfies TubeWithStats,
        );
      }),
    tubeStats: publicProcedure
      .input(z.object({ serverId: z.int(), tube: z.string() }))
      .query(async (opts) => {
        const server = getServer(opts.input.serverId);

        return await server.bsClient.statsTube(opts.input.tube);
      }),
  },
});

function jobStatsProcedure(method: 'peekBuried' | 'peekDelayed' | 'peekReady') {
  return publicProcedure
    .input(z.object({ serverId: z.int(), tube: z.string() }))
    .query(async (opts): Promise<JobWitStats | null> => {
      const server = getServer(opts.input.serverId);
      const { tube } = opts.input;

      try {
        await server.bsClient.use(tube);

        const job = await server.bsClient[method]();
        const jobStats = await server.bsClient.statsJob(job.jobId);

        return {
          job: { id: job.jobId, payload: job.payload.toString() },
          stats: jobStats,
        };
      } catch (err) {
        if (err instanceof NotFoundError) {
          console.log('not found', method, server.address, opts.input.tube);
          return null;
        }

        throw err; // rethrow
      }
    });
}

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
