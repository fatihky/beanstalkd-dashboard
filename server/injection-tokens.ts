import type { InjectionToken } from 'tsyringe';
import type { BeanstalkdServer } from './beanstalkd.js';

const beanstalkdServers = Symbol('beanstalkd-servers') as InjectionToken<
  BeanstalkdServer[]
>;

export default { beanstalkdServers };
