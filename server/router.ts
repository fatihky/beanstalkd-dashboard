import {
  type BeanstalkdExtension,
  type ConnectionStats,
  type JobListEntry,
  type JobStats,
  NotFoundError,
  type TubeStats,
} from 'beanstalkd-ts';
import { container } from 'tsyringe';
import z from 'zod';
import type { BeanstalkdServer } from './beanstalkd.js';
import injectionTokens from './injection-tokens.js';
import { publicProcedure, router } from './trpc.js';

export interface TubeWithStats {
  name: string;
  stats: TubeStats;
}

export interface JobWitStats {
  job: { id: number; payload: string };
  stats: JobStats;
}

/** plain, JSON-serializable shape of `BeanstalkdServer.capabilities` */
export interface ServerCapabilities {
  version: string;
  maxJobSize: number;
  maxTubeNameLen: number;
  extensions: BeanstalkdExtension[];
}

export interface ServerSummary {
  id: number;
  address: string;
  /** what this server supports beyond stock beanstalkd, or `null` against a server without "capabilities" (e.g. stock beanstalkd) */
  capabilities: ServerCapabilities | null;
}

function servers() {
  return container.resolve(injectionTokens.beanstalkdServers);
}

function getServer(id: number) {
  const server = servers().find((s) => s.id === id);

  if (!server) throw new Error(`Server${id} not found.`);

  return server;
}

function hasExtension(
  server: BeanstalkdServer,
  extension: BeanstalkdExtension,
): boolean {
  return server.capabilities?.extensions.includes(extension) ?? false;
}

function toServerSummary(server: BeanstalkdServer): ServerSummary {
  return {
    id: server.id,
    address: server.address,
    capabilities: server.capabilities
      ? {
          version: server.capabilities.version,
          maxJobSize: server.capabilities.maxJobSize,
          maxTubeNameLen: server.capabilities.maxTubeNameLen,
          extensions: server.capabilities.extensions,
        }
      : null,
  };
}

export const appRouter = router({
  servers: {
    list: publicProcedure.query(
      async (): Promise<ServerSummary[]> => servers().map(toServerSummary),
    ),
    stats: publicProcedure
      .input(z.object({ serverId: z.int() }))
      .query(async (opts) => {
        const server = getServer(opts.input.serverId);

        return await server.bsClient.stats();
      }),
    // beanstalkd-pi extension: a bare liveness check, timed round-trip.
    ping: publicProcedure
      .input(z.object({ serverId: z.int() }))
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);
        const start = performance.now();

        await server.bsClient.ping();

        return { latencyMs: performance.now() - start };
      }),
    // beanstalkd-pi extension: toggle drain mode (reject new puts) or just report it.
    drain: publicProcedure
      .input(
        z.object({
          serverId: z.int(),
          action: z.enum(['on', 'off', 'status']),
        }),
      )
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);

        return { draining: await server.bsClient.drain(opts.input.action) };
      }),
  },
  // beanstalkd-pi extension: per-connection introspection, with no stock equivalent at all.
  connections: {
    list: publicProcedure
      .input(z.object({ serverId: z.int() }))
      .query(async (opts): Promise<ConnectionStats[]> => {
        const server = getServer(opts.input.serverId);

        return await server.bsClient.listConnections();
      }),
  },
  jobs: {
    peekBuried: jobStatsProcedure('buried'),
    peekDelayed: jobStatsProcedure('delayed'),
    peekReady: jobStatsProcedure('ready'),
    // beanstalkd-pi extension: a bounded, non-destructive listing of a tube's jobs (no bodies).
    list: publicProcedure
      .input(
        z.object({
          serverId: z.int(),
          tube: z.string(),
          state: z.enum(['buried', 'delayed', 'ready']),
          limit: z.int().min(1).max(10000).optional(),
        }),
      )
      .query(async (opts): Promise<JobListEntry[]> => {
        const server = getServer(opts.input.serverId);
        const { tube, state, limit } = opts.input;

        try {
          return await server.bsClient.listJobs(tube, state, limit);
        } catch (err) {
          // the tube disappears once it has no jobs and no watchers
          if (err instanceof NotFoundError) return [];

          throw err; // rethrow
        }
      }),
    // fetch a single job's body and stats by id, e.g. after picking one from `jobs.list`
    get: publicProcedure
      .input(z.object({ serverId: z.int(), jobId: z.int() }))
      .query(async (opts): Promise<JobWitStats | null> => {
        const server = getServer(opts.input.serverId);

        try {
          const job = await server.bsClient.peek(opts.input.jobId);
          const stats = await server.bsClient.statsJob(job.jobId);

          return {
            job: { id: job.jobId, payload: job.payload.toString() },
            stats,
          };
        } catch (err) {
          if (err instanceof NotFoundError) return null;

          throw err; // rethrow
        }
      }),
    deleteBuried: publicProcedure
      .input(z.object({ serverId: z.int(), tube: z.string(), jobId: z.int() }))
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);

        await server.bsClient.use(opts.input.tube);
        await server.bsClient.deleteJob(opts.input.jobId);

        return 'ok';
      }),
    // delete any job (ready, delayed or buried) by id
    delete: publicProcedure
      .input(z.object({ serverId: z.int(), jobId: z.int() }))
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);

        await server.bsClient.deleteJob(opts.input.jobId);

        return 'ok';
      }),
  },
  tubes: {
    clear: publicProcedure
      .input(z.object({ serverId: z.int(), tube: z.string() }))
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);

        // beanstalkd-pi extension: purge the tube in one round trip instead
        // of peek+delete-ing every job ourselves.
        if (hasExtension(server, 'delete-tube')) {
          await server.bsClient.deleteTube(opts.input.tube);

          return 'ok';
        }

        const states = ['buried', 'delayed', 'ready'] as const;

        await server.bsClient.use(opts.input.tube);

        for (const state of states) {
          for (;;) {
            const job = await peekJob(server, state);

            if (!job) break;

            await server.bsClient.deleteJob(job.jobId);
          }
        }

        await server.bsClient.use('default');

        return 'ok';
      }),
    // beanstalkd-pi extension: "kick" a named tube directly, without a use()/use('default') round trip.
    kick: publicProcedure
      .input(z.object({ serverId: z.int(), tube: z.string(), bound: z.int() }))
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);
        const result = await server.bsClient.kickTube(
          opts.input.tube,
          opts.input.bound,
        );

        return { kicked: result.jobCount };
      }),
    // beanstalkd-pi extension: configure automatic dead-letter routing for a tube.
    setDlq: publicProcedure
      .input(
        z.object({
          serverId: z.int(),
          tube: z.string(),
          maxAttempts: z.int().min(0),
          deadTube: z.string(),
        }),
      )
      .mutation(async (opts) => {
        const server = getServer(opts.input.serverId);

        await server.bsClient.setDlq(
          opts.input.tube,
          opts.input.maxAttempts,
          opts.input.deadTube,
        );

        return 'ok';
      }),
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

        // beanstalkd-pi extension: every tube's stats in one round trip
        // instead of list-tubes + N x stats-tube.
        if (hasExtension(server, 'stats-tube-all')) {
          const allStats = await server.bsClient.statsTubeAll();

          return allStats.map(
            (stats) => ({ name: stats.name, stats }) satisfies TubeWithStats,
          );
        }

        const tubes = await server.bsClient.listTubes();
        const tubeStats = await Promise.all(
          tubes.map((tube) => server.bsClient.statsTube(tube)),
        );

        return tubes.map(
          (tube, i) =>
            // biome-ignore lint/style/noNonNullAssertion: we fetch stats for each tube above
            ({ name: tube, stats: tubeStats[i]! }) satisfies TubeWithStats,
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

function jobStatsProcedure(state: 'buried' | 'delayed' | 'ready') {
  return publicProcedure
    .input(z.object({ serverId: z.int(), tube: z.string() }))
    .query(async (opts): Promise<JobWitStats | null> => {
      const server = getServer(opts.input.serverId);
      const { tube } = opts.input;

      await server.bsClient.use(tube);

      const job = await peekJob(server, state);

      if (!job) return null;

      try {
        const jobStats = await server.bsClient.statsJob(job.jobId);

        return {
          job: { id: job.jobId, payload: job.payload.toString() },
          stats: jobStats,
        };
      } catch (err) {
        if (err instanceof NotFoundError) {
          return null;
        }

        throw err; // rethrow
      }
    });
}

async function peekJob(
  server: BeanstalkdServer,
  state: 'buried' | 'delayed' | 'ready',
) {
  try {
    const job =
      await server.bsClient[
        state === 'buried'
          ? 'peekBuried'
          : state === 'delayed'
            ? 'peekDelayed'
            : 'peekReady'
      ]();

    return job;
  } catch (err) {
    if (err instanceof NotFoundError) {
      return null;
    }

    throw err; // rethrow
  }
}

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
