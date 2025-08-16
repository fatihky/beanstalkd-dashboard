import { useMutation } from '@tanstack/react-query';
import { Hourglass, Pause, Play } from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { Button } from '../retroui/Button';

export function TubeActions({
  serverId,
  tube,
  pause,
  pauseTimeLeft,
  onMutate,
}: {
  serverId: number;
  tube: string;
  pause: number;
  pauseTimeLeft: number;
  onMutate: () => void;
}) {
  const trpc = useTRPC();
  const pauseTube = useMutation(trpc.tubes.pause.mutationOptions({ onMutate }));
  const paused = pause > 0 && pauseTimeLeft > 0;

  return paused ? (
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
  );
}
