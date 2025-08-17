import { useId } from 'preact/hooks';
import { useServerStore } from '@/server-store';
import { Label } from './retroui/Label';
import { Select } from './retroui/Select';
import { useLocation, useRoute } from 'preact-iso';

export function AppHeader() {
  const serverStore = useServerStore();
  const selectedServer = serverStore.servers.find(
    (server) => server.id === serverStore.selectedServerId,
  );
  const serverSelectId = useId();
  const route = useRoute();
  const location = useLocation();

  return (
    <div className="w-full flex items-center justify-between">
      <div>
        <a className="text-lg font-bold" href="/">
          beanstalkd-ts-console
        </a>
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

            if (server) {
              serverStore.setSelectedServer(server);

              if (route.path !== '/') location.route('/'); // redirect to home
            }
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
