import 'reflect-metadata';

import * as trpcExpress from '@trpc/server/adapters/express';
import { program } from 'commander';
import cors from 'cors';
import express from 'express';
import { container } from 'tsyringe';
import z from 'zod';
import { BeanstalkdServer } from './beanstalkd';
import injectionTokens from './injection-tokens';
import { appRouter } from './router';

const optionsSchema = z.object({
  servers: z.string().default('localhost:11300'),
});

const prog = program
  .option(
    '--servers <addresses>',
    'Beanstalkd server addresses in format [host:port,...] (comma separated). Example: localhost:11300',
    'localhost:11300',
  )
  .parse(process.argv);

// created for each request
const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;

async function main() {
  const { servers } = optionsSchema.parse(prog.opts());
  const app = express();
  const bsServers = servers
    .split(',')
    .map((address, i) => new BeanstalkdServer(i + 1, address));

  await Promise.all(bsServers.map((server) => server.bsClient.connect()));

  container.registerInstance(injectionTokens.beanstalkdServers, bsServers);

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
