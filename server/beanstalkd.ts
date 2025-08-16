import { BeanstalkdClient } from 'beanstalkd-ts';

export class BeanstalkdServer {
  readonly bsClient: BeanstalkdClient;

  constructor(
    readonly id: number,
    readonly address: string,
  ) {
    const [host, port] = address.split(':');

    this.bsClient = new BeanstalkdClient({ host, port: Number(port) });
  }
}
