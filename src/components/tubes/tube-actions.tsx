import { useMutation } from '@tanstack/react-query';
import { Pause, Play } from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { Button } from '../retroui/Button';

export function TubeActions({
  name,
  pause,
  pauseTimeLeft,
  onMutate,
}: {
  name: string;
  pause: number;
  pauseTimeLeft: number;
  onMutate: () => void;
}) {
  const trpc = useTRPC();
  const pauseTube = useMutation(trpc.tubes.pause.mutationOptions({ onMutate }));
  const resumeTube = useMutation(
    trpc.tubes.resume.mutationOptions({ onMutate }),
  );
  const paused = pause > 0 && pauseTimeLeft > 0;

  return paused ? (
    <Button
      disabled={resumeTube.isPending}
      size="icon"
      onClick={() => resumeTube.mutate(name)}
    >
      <Play className="w-4 h-4" />
    </Button>
  ) : (
    <Button
      disabled={pauseTube.isPending}
      size="icon"
      onClick={() => pauseTube.mutate([name, 99999])}
    >
      <Pause className="w-4 h-4" />
    </Button>
  );
}
