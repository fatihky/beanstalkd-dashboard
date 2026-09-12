import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ServerSummary } from '../server/router';

type BeanstalkdServerMeta = ServerSummary;

export const useServerStore = create(
  persist<{
    selectedServerId: number;
    servers: BeanstalkdServerMeta[];
    setSelectedServer: (server: BeanstalkdServerMeta) => void;
    setServers: (servers: BeanstalkdServerMeta[]) => void;
  }>(
    (set) => ({
      selectedServerId: 1,
      servers: [],
      setSelectedServer: (server) => set({ selectedServerId: server.id }),
      setServers: (servers: BeanstalkdServerMeta[]) => set({ servers }),
    }),
    {
      name: 'beanstalkd-ts-console:servers',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
