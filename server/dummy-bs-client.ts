import { BeanstalkdClient } from 'beanstalkd-ts';

const tube = 'console-demo';

async function producer() {
  const bsClient = new BeanstalkdClient();

  bsClient.defaultTtr = 300;

  await bsClient.connect();
  await bsClient.use(tube);

  for (;;) {
    await Promise.all([
      bsClient.put('demo content', { ttr: 1000 }),
      bsClient.put('demo content', { ttr: 1000 }),
      bsClient.put('demo content', { ttr: 1000 }),
      bsClient.put('demo content', { ttr: 1000 }),
      bsClient.put('demo content', { ttr: 1000 }),
      bsClient.put('demo content', { delay: 10, ttr: 1000 }),
    ]);

    await new Promise((r) => setTimeout(r, Math.round(Math.random() * 400)));
  }
}

async function worker(limit = Infinity) {
  const bsClient = new BeanstalkdClient();

  await bsClient.connect();
  await bsClient.watch(tube);
  await bsClient.ignore('default');

  for (let jobs = 0; jobs < limit; jobs++) {
    const job = await bsClient.reserve();

    await new Promise((r) => setTimeout(r, Math.round(Math.random() * 100)));

    await bsClient.deleteJob(job.id);
  }

  await bsClient.close();
}

async function main() {
  setInterval(() => {
    worker(Math.round(Math.random() * 10));
    worker(Math.round(Math.random() * 20));
  }, 100);

  await Promise.all([
    producer(),
    producer(),
    producer(),
    producer(),
    worker(),
    worker(),
  ]);
}

main().catch((err) => {
  console.log('main error:', err);
});
