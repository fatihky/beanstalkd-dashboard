import 'reflect-metadata';

import { createServer } from 'node:http';
import path from 'node:path';
import * as trpcExpress from '@trpc/server/adapters/express';
import { program } from 'commander';
import cors from 'cors';
import express from 'express';
import { container } from 'tsyringe';
import ViteExpress from 'vite-express';
import z from 'zod';
import { BeanstalkdServer } from './beanstalkd.js';
import injectionTokens from './injection-tokens.js';
import { appRouter } from './router.js';

const optionsSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.coerce.number().default(3000),
  servers: z.string().default('localhost:11300'),
});

const prog = program
  .option('--host [host]', 'Listen host.', '127.0.0.1')
  .option('--port [port]', 'Listen port.', '3000')
  .option(
    '--servers <addresses>',
    'Beanstalkd server addresses in format [host:port,...] (comma separated). Example: localhost:11300',
    'localhost:11300',
  )
  .parse(process.argv);

async function main() {
  const { host, port, servers } = optionsSchema.parse(prog.opts());
  const app = express();
  const server = createServer(app);
  const bsServers = servers
    .split(',')
    .map((address, i) => new BeanstalkdServer(i + 1, address));

  await Promise.all(bsServers.map((server) => server.bsClient.connect()));

  container.registerInstance(injectionTokens.beanstalkdServers, bsServers);

  app.use(cors({}));
  app.use('/trpc', trpcExpress.createExpressMiddleware({ router: appRouter }));

  ViteExpress.config({
    mode: 'production',
    inlineViteConfig: {
      build: {
        outDir: path.join(import.meta.dirname, '..', 'dist'),
      },
    },
  });

  ViteExpress.bind(app, server);

  server.listen(port, host, () => {
    console.log(`Server started listening on http://${host}:${port}`);
  });
}

main().catch((err) => console.log('Main error:', err));
