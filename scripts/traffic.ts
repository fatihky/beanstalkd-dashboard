/**
 * Generates lightweight, realistic-looking traffic against a beanstalkd server
 * so the dashboard has something to show.
 *
 *   pnpm traffic                                  # localhost:11300, 3 tubes, ~5 jobs/s
 *   pnpm traffic --server localhost:11301 --tubes 5 --rate 20 --hold 60
 *
 * Producers put jobs (some delayed, mixed priorities) into `demo-*` tubes.
 * Workers let jobs sit in the ready queue for about `--hold` seconds (default
 * 30): for every job that has been ready that long, a worker reserves one
 * (whichever beanstalkd hands out, so urgent jobs still jump the line),
 * "processes" it for a moment, and mostly deletes it —
 * occasionally releasing (retry with delay) or burying (failure). Buried jobs
 * are kicked back periodically so they don't pile up forever. Ctrl+C to stop.
 */
import { parseArgs } from 'node:util';
import { BeanstalkdClient } from 'beanstalkd-ts';

const { values: args } = parseArgs({
  options: {
    server: { type: 'string', default: 'localhost:11300' },
    tubes: { type: 'string', default: '3' },
    rate: { type: 'string', default: '5' },
    workers: { type: 'string', default: '2' },
    hold: { type: 'string', default: '30' },
  },
});

const [host = 'localhost', port = '11300'] = (args.server ?? '').split(':');
const tubeCount = Math.max(1, Number(args.tubes));
const rate = Math.max(0.1, Number(args.rate)); // total jobs/s across all tubes
const workersPerTube = Math.max(0, Number(args.workers));
const holdMs = Math.max(0, Number(args.hold)) * 1000; // min job age before a worker takes it

const tubeNames = ['emails', 'thumbnails', 'reports', 'webhooks', 'exports'];
const tubes = Array.from(
  { length: tubeCount },
  (_, i) => `demo-${tubeNames[i % tubeNames.length]}${i >= tubeNames.length ? `-${i}` : ''}`,
);

const counters = { put: 0, deleted: 0, released: 0, buried: 0, kicked: 0 };
let stopping = false;

/**
 * Per tube, sorted timestamps (ms) at which jobs became ready. Workers only
 * reserve once the oldest entry is `holdMs` old, so the ready queue holds
 * roughly `rate * hold` jobs at steady state.
 */
const readyAt = new Map<string, number[]>(tubes.map((t) => [t, []]));

function trackReady(tube: string, at: number) {
  const list = readyAt.get(tube) ?? [];
  let i = list.length;
  while (i > 0 && (list[i - 1] ?? 0) > at) i--;
  list.splice(i, 0, at);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)] as T;

function newClient() {
  return new BeanstalkdClient({ host, port: Number(port) });
}

async function producer() {
  const client = newClient();
  await client.connect();

  let currentTube = '';

  while (!stopping) {
    const tube = pick(tubes);
    if (tube !== currentTube) {
      await client.use(tube);
      currentTube = tube;
    }

    const payload = JSON.stringify({ tube, createdAt: new Date().toISOString(), n: counters.put });
    const delay = Math.random() < 0.15 ? 5 + Math.floor(Math.random() * 25) : 0;

    await client.put(payload, { pri: pick([0, 512, 1024, 1024, 1024, 2048]), delay, ttr: 30 });
    trackReady(tube, Date.now() + delay * 1000);
    counters.put++;

    // exponential inter-arrival times give a bursty, natural-looking rate
    await sleep((-Math.log(1 - Math.random()) / rate) * 1000);
  }

  await client.close();
}

async function worker(tube: string) {
  const client = newClient();
  await client.connect();
  await client.watch(tube);
  await client.ignore('default');

  const pending = readyAt.get(tube) ?? [];

  while (!stopping) {
    const oldest = pending[0];
    const waitMs = oldest === undefined ? 500 : oldest + holdMs - Date.now();
    if (waitMs > 0) {
      await sleep(Math.min(waitMs, 1000));
      continue;
    }
    pending.shift();

    let job: Awaited<ReturnType<BeanstalkdClient['reserveWithTimeout']>>;
    try {
      job = await client.reserveWithTimeout(1);
    } catch {
      continue; // timed out — loop to re-check `stopping`
    }

    await sleep(50 + Math.random() * 450);

    const roll = Math.random();
    if (roll < 0.03) {
      await client.bury(job.id);
      counters.buried++;
    } else if (roll < 0.1) {
      const delay = 2 + Math.floor(Math.random() * 8);
      await client.release(job.id, 1024, delay);
      trackReady(tube, Date.now() + delay * 1000);
      counters.released++;
    } else {
      await client.deleteJob(job.id);
      counters.deleted++;
    }
  }

  await client.close();
}

/** periodically kick buried jobs back to ready so they don't accumulate */
async function janitor() {
  const client = newClient();
  await client.connect();

  for (let tick = 1; !stopping; tick++) {
    await sleep(1000); // short ticks so shutdown isn't held up
    if (stopping || tick % 30 !== 0) continue;

    for (const tube of tubes) {
      // stock `kick` moves delayed jobs when nothing is buried, so only kick if needed
      const { currentJobsBuried } = await client.statsTube(tube);
      if (currentJobsBuried === 0) continue;

      await client.use(tube);
      const { jobCount } = await client.kick(currentJobsBuried);
      for (let i = 0; i < jobCount; i++) trackReady(tube, Date.now());
      counters.kicked += jobCount;
    }
  }

  await client.close();
}

function report() {
  const c = counters;
  console.log(
    `put=${c.put} deleted=${c.deleted} released=${c.released} buried=${c.buried} kicked=${c.kicked}`,
  );
}

async function main() {
  console.log(
    `traffic -> ${host}:${port} | tubes: ${tubes.join(', ')} | ~${rate} jobs/s | ${workersPerTube} worker(s)/tube`,
  );

  const interval = setInterval(report, 5000);

  process.on('SIGINT', () => {
    if (stopping) process.exit(1);
    console.log('\nstopping... (Ctrl+C again to force)');
    stopping = true;
  });

  await Promise.all([
    producer(),
    janitor(),
    ...tubes.flatMap((tube) => Array.from({ length: workersPerTube }, () => worker(tube))),
  ]);

  clearInterval(interval);
  report();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
