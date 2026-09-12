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
  port: z.coerce.number().default(4000),
  servers: z.string().default('localhost:11300'),
});

const prog = program
  .option('--host [host]', 'Listen host.', '127.0.0.1')
  .option('--port [port]', 'Listen port.', '4000')
  .option(
    '--servers <addresses>',
    'Beanstalkd server addresses in format [host:port,...] (comma separated). Example: localhost:11300',
    'localhost:11300',
  )
  .parse(process.argv);

async function main() {
  console.log('[main] parsing options...');
  const { host, port, servers } = optionsSchema.parse(prog.opts());
  console.log('[main] options parsed:', { host, port, servers });

  const app = express();
  const server = createServer(app);
  const bsServers = servers
    .split(',')
    .map((address, i) => new BeanstalkdServer(i + 1, address));

  console.log(
    '[main] connecting to beanstalkd servers:',
    bsServers.map((s) => `#${s.id} ${s.address}`),
  );
  await Promise.all(
    bsServers.map(async (server) => {
      console.log(`[main] [server #${server.id}] connecting to ${server.address}...`);
      await server.bsClient.connect();
      console.log(`[main] [server #${server.id}] connected`);
    }),
  );
  console.log('[main] all servers connected, detecting capabilities...');

  await Promise.all(
    bsServers.map(async (server) => {
      console.log(`[main] [server #${server.id}] detecting capabilities...`);
      const timeoutMs = 5000;
      const timedOut = Symbol('timeout');
      const result = await Promise.race([
        server.detectCapabilities(),
        new Promise((resolve) => setTimeout(() => resolve(timedOut), timeoutMs)),
      ]);
      if (result === timedOut) {
        console.log(
          `[main] [server #${server.id}] TIMED OUT after ${timeoutMs}ms waiting for "capabilities" response from ${server.address} — server likely doesn't reply to this command`,
        );
        return;
      }
      console.log(`[main] [server #${server.id}] capabilities:`, server.capabilities);
    }),
  );
  console.log('[main] all capabilities detected (or timed out)');

  container.registerInstance(injectionTokens.beanstalkdServers, bsServers);

  app.use(cors({}));
  app.use('/trpc', trpcExpress.createExpressMiddleware({ router: appRouter }));
  console.log('[main] express middleware registered');

  ViteExpress.config({
    mode: 'production',
    inlineViteConfig: {
      build: {
        outDir: path.join(import.meta.dirname, '..', 'dist'),
      },
    },
  });

  ViteExpress.bind(app, server);
  console.log('[main] ViteExpress bound, starting to listen...');

  server.listen(port, host, () => {
    console.log(`Server started listening on http://${host}:${port}`);
  });
}

main().catch((err) => console.log('Main error:', err));
