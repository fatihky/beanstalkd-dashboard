import type { TubeStats } from 'beanstalkd-ts';
import { bsClient } from './beanstalkd';
import { publicProcedure, router } from './trpc';
import z from 'zod';

export interface TubeWithStats {
  name: string;
  stats: TubeStats;
}

export const appRouter = router({
  tubes: {
    pause: publicProcedure
      .input(z.tuple([z.string(), z.int()]))
      .mutation(async (opts) => {
        await bsClient.pauseTube(opts.input[0], opts.input[1]);

        return 'ok';
      }),
    resume: publicProcedure.input(z.string()).mutation(async (opts) => {
      await bsClient.pauseTube(opts.input, 0);

      return 'ok';
    }),
    list: publicProcedure.query(async () => {
      const tubes = await bsClient.listTubes();
      const tubeStats: TubeStats[] = [];

      for (const tube of tubes) {
        tubeStats.push(await bsClient.statsTube(tube));
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
