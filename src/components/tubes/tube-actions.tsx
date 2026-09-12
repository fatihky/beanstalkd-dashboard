import { useMutation } from '@tanstack/react-query';
import { Hourglass, Pause, Play, Settings, Trash2 } from 'lucide-react';
import { useState } from 'preact/hooks';
import { useLocation, useRoute } from 'preact-iso';
import { hasExtension } from '@/lib/server-capabilities';
import { useTRPC } from '@/utils/trpc';
import type { ServerCapabilities } from '../../../server/router';
import { Badge } from '../retroui/Badge';
import { Button } from '../retroui/Button';
import { Dialog } from '../retroui/Dialog';
import { Label } from '../retroui/Label';

export function TubeActions({
  serverAddress,
  serverId,
  tube,
  pause,
  pauseTimeLeft,
  capabilities = null,
  dlqMaxAttempts = 0,
  dlqTube = '',
  onMutate,
}: {
  serverAddress: string;
  serverId: number;
  tube: string;
  pause: number;
  pauseTimeLeft: number;
  /** the connected server's beanstalkd-pi capabilities, or `null` against stock beanstalkd */
  capabilities?: ServerCapabilities | null;
  /** the tube's current dead-letter routing config, if any (see "set-dlq") */
  dlqMaxAttempts?: number;
  dlqTube?: string;
  onMutate: () => void;
}) {
  const location = useLocation();
  const route = useRoute();
  const trpc = useTRPC();
  const pauseTube = useMutation(trpc.tubes.pause.mutationOptions({ onMutate }));
  const clearTube = useMutation(
    trpc.tubes.clear.mutationOptions({
      onMutate: () => {
        if (route.path !== '/') location.route('/'); // redirect user to the home after cleaning the queue
      },
    }),
  );
  const setDlq = useMutation(trpc.tubes.setDlq.mutationOptions({ onMutate }));
  const paused = pause > 0 && pauseTimeLeft > 0;
  const canDlq = hasExtension(capabilities, 'set-dlq');
  const [maxAttempts, setMaxAttempts] = useState(dlqMaxAttempts);
  const [deadTube, setDeadTube] = useState(dlqTube);

  return (
    <div className="flex justify-end gap-3">
      {tube !== 'default' && (
        <Dialog>
          <Dialog.Trigger>
            <Button size="icon" variant="danger">
              {clearTube.isPending ? (
                'Clearing...'
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header className="bg-red-500 text-white font-bold">
              Are you sure want to clear tube?
            </Dialog.Header>
            <section className="flex flex-col p-3">
              <section>
                The tube <Badge>{tube}</Badge> in the server{' '}
                <Badge size="sm">{serverAddress}</Badge> will be{' '}
                <span className="font-bold">CLEARED</span>.
              </section>
              <section className="mb-3 text-sm">
                This action cannot be <span className="font-bold">UNDONE</span>.
              </section>

              <section className="flex w-full justify-end">
                <Dialog.Trigger asChild>
                  <Button
                    variant="danger"
                    onClick={() => clearTube.mutate({ serverId, tube })}
                  >
                    Confirm
                  </Button>
                </Dialog.Trigger>
              </section>
            </section>
          </Dialog.Content>
        </Dialog>
      )}

      {canDlq && (
        <Dialog>
          <Dialog.Trigger>
            <Button
              size="icon"
              title="Configure dead-letter routing (beanstalkd-pi)"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>Dead-letter routing for {tube}</Dialog.Header>
            <section className="flex flex-col gap-3 p-3">
              <section className="text-sm">
                Bury a job here automatically once it has been released or timed
                out this many times in a row. Set max attempts to 0 to disable.
              </section>

              <label className="flex flex-col gap-1">
                <Label>Max attempts</Label>
                <input
                  type="number"
                  min={0}
                  className="border-2 border-black px-2 py-1"
                  value={maxAttempts}
                  onChange={(e) =>
                    setMaxAttempts(Number((e.target as HTMLInputElement).value))
                  }
                />
              </label>

              <label className="flex flex-col gap-1">
                <Label>Dead-letter tube</Label>
                <input
                  type="text"
                  className="border-2 border-black px-2 py-1"
                  value={deadTube}
                  onChange={(e) =>
                    setDeadTube((e.target as HTMLInputElement).value)
                  }
                />
              </label>

              <section className="flex w-full justify-end">
                <Dialog.Trigger asChild>
                  <Button
                    disabled={
                      setDlq.isPending || (maxAttempts > 0 && !deadTube)
                    }
                    onClick={() =>
                      setDlq.mutate({ serverId, tube, maxAttempts, deadTube })
                    }
                  >
                    Save
                  </Button>
                </Dialog.Trigger>
              </section>
            </section>
          </Dialog.Content>
        </Dialog>
      )}

      {paused ? (
        <Button
          disabled={pauseTube.isPending}
          size="icon"
          onClick={() => pauseTube.mutate({ serverId, tube, seconds: 0 })}
        >
          {pauseTube.isPending ? (
            <Hourglass className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
      ) : (
        <Button
          disabled={pauseTube.isPending}
          size="icon"
          onClick={() => pauseTube.mutate({ serverId, tube, seconds: 999999 })}
        >
          {pauseTube.isPending ? (
            <Hourglass className="w-4 h-4" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}
