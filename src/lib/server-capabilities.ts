import type { BeanstalkdExtension } from 'beanstalkd-ts';
import type { ServerCapabilities } from '../../server/router';

/**
 * Whether a server (as returned by `servers.list`) reported support for a
 * given beanstalkd-pi extension command via "capabilities". Servers that
 * don't understand "capabilities" at all (e.g. stock beanstalkd) report
 * `capabilities: null`, so every extension is unsupported there.
 */
export function hasExtension(
  capabilities: ServerCapabilities | null | undefined,
  extension: BeanstalkdExtension,
): boolean {
  return capabilities?.extensions.includes(extension) ?? false;
}
