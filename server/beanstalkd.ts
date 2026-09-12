import { BeanstalkdClient, type Capabilities } from 'beanstalkd-ts';

export class BeanstalkdServer {
  readonly bsClient: BeanstalkdClient;

  /**
   * What the connected server supports beyond stock beanstalkd (see
   * beanstalkd-pi's extension commands), or `null` against a server that
   * doesn't understand "capabilities" at all (e.g. stock beanstalkd).
   * Populated by `detectCapabilities()` once connected.
   */
  capabilities: Capabilities | null = null;

  constructor(
    readonly id: number,
    readonly address: string,
  ) {
    const [host, port] = address.split(':');

    this.bsClient = new BeanstalkdClient({ host, port: Number(port) });
  }

  async detectCapabilities(): Promise<void> {
    this.capabilities = await this.bsClient.detectCapabilities();
  }
}
