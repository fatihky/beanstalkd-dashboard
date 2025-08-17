import { useMutation } from '@tanstack/react-query';
import { Hourglass, Pause, Play, Trash2 } from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { Badge } from '../retroui/Badge';
import { Button } from '../retroui/Button';
import { Dialog } from '../retroui/Dialog';
import { useLocation, useRoute } from 'preact-iso';

export function TubeActions({
  serverAddress,
  serverId,
  tube,
  pause,
  pauseTimeLeft,
  onMutate,
}: {
  serverAddress: string;
  serverId: number;
  tube: string;
  pause: number;
  pauseTimeLeft: number;
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
  const paused = pause > 0 && pauseTimeLeft > 0;

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
