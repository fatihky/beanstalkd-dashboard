import { BeanstalkdClient } from 'beanstalkd-ts';

const tube = 'console-demo';

async function producer() {
  const bsClient = new BeanstalkdClient();

  bsClient.defaultTtr = 300;

  await bsClient.connect();
  await bsClient.use(tube);

  for (;;) {
    await bsClient.put('sa as', { ttr: 1000 });

    await new Promise((r) => setTimeout(r, Math.round(Math.random() * 1000)));
  }
}

async function worker() {
  const bsClient = new BeanstalkdClient();

  await bsClient.connect();
  await bsClient.watch(tube);
  await bsClient.ignore('default');

  for (;;) {
    const job = await bsClient.reserve();

    await new Promise((r) => setTimeout(r, Math.round(Math.random() * 1000)));

    await bsClient.deleteJob(job.id);
  }
}

async function main() {
  await Promise.all([producer(), worker()]);
}

main().catch((err) => {
  console.log('main error:', err);
});
