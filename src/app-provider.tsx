import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'preact/compat';
import { useServerStore } from './server-store';
import { useTRPC } from './utils/trpc';

export function AppProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPC();
  const setServers = useServerStore((s) => s.setServers);
  const result = useQuery(trpc.servers.list.queryOptions());

  useEffect(() => {
    if (result.data) {
      setServers(result.data);
    }
  }, [result.data, setServers]);

  return children;
}
