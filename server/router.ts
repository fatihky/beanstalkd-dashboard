import { publicProcedure, router } from './trpc';
import { bsClient } from './beanstalkd';

export const appRouter = router({
  tubes: {
    list: publicProcedure.query(async () => {
      return await bsClient.listTubes();
    }),
  },
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
