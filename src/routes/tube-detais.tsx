import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { TubeStats } from 'beanstalkd-ts';
import { ArrowLeftCircle, Info } from 'lucide-react';
import { useRoute } from 'preact-iso';
import { AppHeader } from '@/components/app-header';
import { AutoHighlightNumberCell } from '@/components/auto-highlight-number-cell';
import { PeekJob } from '@/components/jobs/peek-job';
import { Badge } from '@/components/retroui/Badge';
import { buttonVariants } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { TubeActions } from '@/components/tubes/tube-actions';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import { NotFound } from './404';
import { Alert } from '@/components/retroui/Alert';

function TubeStatsCard({
  stats,
}: {
  stats: UseQueryResult<TubeStats, unknown>;
}) {
  return (
    <Card className="w-full">
      <Card.Content className="flex flex-col gap-2">
        {stats.data && stats.data.pauseTimeLeft > 0 && (
          <Alert className="flex flex-col gap-2">
            <span className="flex items-center gap-1">
              <Info className="w-4 h-4" />
              Tube paused.
            </span>
            <span className="flex gap-1">
              The tube will be resumed after
              <span className="text-background bg-foreground/70 px-2">
                {stats.data.pauseTimeLeft}
              </span>
              seconds.
            </span>
          </Alert>
        )}
        <div className="flex gap-1">
          <Badge variant="solid">jobs</Badge>
          <Badge>
            urgent
            <AutoHighlightNumberCell
              value={stats.data?.currentJobsUrgent ?? 0}
            />
          </Badge>
          <Badge>
            ready
            <AutoHighlightNumberCell
              value={stats.data?.currentJobsReady ?? 0}
            />
          </Badge>
          <Badge>
            reserved
            <AutoHighlightNumberCell
              value={stats.data?.currentJobsReserved ?? 0}
            />
          </Badge>
          <Badge>
            delayed
            <AutoHighlightNumberCell
              value={stats.data?.currentJobsDelayed ?? 0}
            />
          </Badge>
          <Badge>
            buried
            <AutoHighlightNumberCell
              value={stats.data?.currentJobsBuried ?? 0}
            />
          </Badge>
          <Badge>
            total
            <AutoHighlightNumberCell value={stats.data?.totalJobs ?? 0} />
          </Badge>
        </div>

        <div className="flex gap-1">
          <Badge variant="solid">commands</Badge>
          <Badge>
            deletes
            <AutoHighlightNumberCell value={stats.data?.cmdDelete ?? 0} />
          </Badge>
          <Badge>
            pauses
            <AutoHighlightNumberCell value={stats.data?.cmdPauseTube ?? 0} />
          </Badge>
        </div>

        <div className="flex gap-1">
          <Badge variant="solid">connections</Badge>
          <Badge>
            producers
            <AutoHighlightNumberCell value={stats.data?.currentUsing ?? 0} />
          </Badge>
          <Badge>
            consumers
            <AutoHighlightNumberCell value={stats.data?.currentWatching ?? 0} />
          </Badge>
          <Badge>
            consumers waiting
            <AutoHighlightNumberCell value={stats.data?.currentWaiting ?? 0} />
          </Badge>
        </div>
      </Card.Content>
    </Card>
  );
}

function TubeDetails({ serverId, tube }: { serverId: number; tube: string }) {
  const trpc = useTRPC();
  const stats = useQuery(
    trpc.tubes.tubeStats.queryOptions(
      { serverId, tube },
      {
        refetchInterval: 1000,
      },
    ),
  );

  return (
    <div className="p-3">
      <AppHeader />

      <div>
        <a
          className={cn(
            buttonVariants({ variant: 'link' }),
            'flex gap-2 text-sm',
          )}
          href="/"
        >
          <ArrowLeftCircle /> Tubes
        </a>
      </div>

      <div className="flex items-center justify-between pb-2 text-lg font-bold my-3 border-b-4 border-primary/60">
        <span>{tube}</span>

        <TubeActions
          serverId={serverId}
          tube={tube}
          pause={stats.data?.pause ?? 0}
          pauseTimeLeft={stats.data?.pauseTimeLeft ?? 0}
          onMutate={() => {}}
        />
      </div>

      <TubeStatsCard stats={stats} />

      <div className="flex gap-2 mt-4 max-w-full">
        <PeekJob serverId={Number(serverId)} state="ready" tube={tube} />
        <PeekJob serverId={Number(serverId)} state="delayed" tube={tube} />
        <PeekJob serverId={Number(serverId)} state="buried" tube={tube} />
      </div>
    </div>
  );
}

export default function TubeDetailsPage() {
  const { params } = useRoute();
  const { serverId, tube } = params;

  if (!serverId) return <NotFound />;
  if (!tube) return <NotFound />;

  return <TubeDetails serverId={Number(serverId)} tube={tube} />;
}
