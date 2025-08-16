import { useServerStore } from '@/server-store';
import { Select } from './retroui/Select';
import { Label } from './retroui/Label';
import { useId } from 'preact/hooks';

export function AppHeader() {
  const serverStore = useServerStore();
  const selectedServer = serverStore.servers.find(
    (server) => server.id === serverStore.selectedServerId,
  );
  const serverSelectId = useId();

  return (
    <div className="w-full flex items-center justify-between">
      <div>
        <span className="text-lg font-bold">beanstalkd-ts-console</span>
      </div>
      <div className="flex gap-2 items-center">
        <Label htmlFor={serverSelectId} className="text-lg">
          Server:
        </Label>
        <Select
          value={selectedServer?.id.toString()}
          onValueChange={(id) => {
            const server = serverStore.servers.find(
              (s) => s.id.toString() === id,
            );

            if (server) serverStore.setSelectedServer(server);
          }}
        >
          <Select.Trigger id={serverSelectId} className="min-w-60">
            <Select.Value placeholder="Select server" />
          </Select.Trigger>

          <Select.Content>
            <Select.Group>
              {serverStore.servers.map((server) => (
                <Select.Item key={server.id} value={server.id.toString()}>
                  {server.address}
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Content>
        </Select>
      </div>
    </div>
  );
}
