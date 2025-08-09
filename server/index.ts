import * as trpcExpress from '@trpc/server/adapters/express';
import express from 'express';
import { bsClient } from './beanstalkd';
import { appRouter } from './router';
import cors from 'cors';

// created for each request
const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;

async function main() {
  const app = express();

  await bsClient.connect();

  app.use(cors({}));

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({ router: appRouter, createContext }),
  );

  app.listen(4000, '127.0.0.1', () => {
    console.log('trpc server started listening on http://localhost:4000');
  });
}

main().catch((err) => console.log('Main error:', err));
