import { useQuery } from '@tanstack/react-query';
import { ArrowLeftCircle } from 'lucide-react';
import { useRoute } from 'preact-iso';
import { AppHeader } from '@/components/app-header';
import { AutoHighlightNumberCell } from '@/components/auto-highlight-number-cell';
import { Badge } from '@/components/retroui/Badge';
import { buttonVariants } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { cn } from '@/lib/utils';
import { useServerStore } from '@/server-store';
import { useTRPC } from '@/utils/trpc';
import { NotFound } from './404';

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    days && `${days}d`,
    hours && `${hours}h`,
    minutes && `${minutes}m`,
    `${secs}s`,
  ]
    .filter(Boolean)
    .join(' ');
}

function ServerStats({ serverId }: { serverId: number }) {
  const trpc = useTRPC();
  const stats = useQuery(
    trpc.servers.stats.queryOptions({ serverId }, { refetchInterval: 1000 }),
  );
  const data = stats.data;

  return (
    <div className="p-3">
      <AppHeader />

      <div>
        <a
          className={cn(
            buttonVariants({ variant: 'link' }),
            'w-fit flex gap-2 text-sm',
          )}
          href="/"
        >
          <ArrowLeftCircle /> Tubes
        </a>
      </div>

      <div className="flex items-center justify-between pb-2 text-lg font-bold my-3 border-b-4 border-primary/60">
        <span>Server Stats</span>
      </div>

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            <Badge variant="solid">server</Badge>
            <Badge>version {data?.version ?? '-'}</Badge>
            <Badge>hostname {data?.hostname ?? '-'}</Badge>
            <Badge>pid {data?.pid ?? '-'}</Badge>
            <Badge>os {data?.os ?? '-'}</Badge>
            <Badge>platform {data?.platform ?? '-'}</Badge>
            <Badge>uptime {data ? formatUptime(data.uptime) : '-'}</Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="solid">jobs</Badge>
            <Badge>
              urgent
              <AutoHighlightNumberCell value={data?.currentJobsUrgent ?? 0} />
            </Badge>
            <Badge>
              ready
              <AutoHighlightNumberCell value={data?.currentJobsReady ?? 0} />
            </Badge>
            <Badge>
              reserved
              <AutoHighlightNumberCell
                value={data?.currentJobsReserved ?? 0}
              />
            </Badge>
            <Badge>
              delayed
              <AutoHighlightNumberCell value={data?.currentJobsDelayed ?? 0} />
            </Badge>
            <Badge>
              buried
              <AutoHighlightNumberCell value={data?.currentJobsBuried ?? 0} />
            </Badge>
            <Badge>
              total
              <AutoHighlightNumberCell value={data?.totalJobs ?? 0} />
            </Badge>
            <Badge>
              timeouts
              <AutoHighlightNumberCell value={data?.jobTimeouts ?? 0} />
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="solid">connections</Badge>
            <Badge>
              current
              <AutoHighlightNumberCell value={data?.currentConnections ?? 0} />
            </Badge>
            <Badge>
              total
              <AutoHighlightNumberCell value={data?.totalConnections ?? 0} />
            </Badge>
            <Badge>
              producers
              <AutoHighlightNumberCell value={data?.currentProducers ?? 0} />
            </Badge>
            <Badge>
              workers
              <AutoHighlightNumberCell value={data?.currentWorkers ?? 0} />
            </Badge>
            <Badge>
              waiting
              <AutoHighlightNumberCell value={data?.currentWaiting ?? 0} />
            </Badge>
            <Badge>
              tubes
              <AutoHighlightNumberCell value={data?.currentTubes ?? 0} />
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="solid">commands</Badge>
            <Badge>
              put
              <AutoHighlightNumberCell value={data?.cmdPut ?? 0} />
            </Badge>
            <Badge>
              reserve
              <AutoHighlightNumberCell value={data?.cmdReserve ?? 0} />
            </Badge>
            <Badge>
              reserve-with-timeout
              <AutoHighlightNumberCell
                value={data?.cmdReserveWithTimeout ?? 0}
              />
            </Badge>
            <Badge>
              delete
              <AutoHighlightNumberCell value={data?.cmdDelete ?? 0} />
            </Badge>
            <Badge>
              release
              <AutoHighlightNumberCell value={data?.cmdRelease ?? 0} />
            </Badge>
            <Badge>
              bury
              <AutoHighlightNumberCell value={data?.cmdBury ?? 0} />
            </Badge>
            <Badge>
              kick
              <AutoHighlightNumberCell value={data?.cmdKick ?? 0} />
            </Badge>
            <Badge>
              touch
              <AutoHighlightNumberCell value={data?.cmdTouch ?? 0} />
            </Badge>
            <Badge>
              pause-tube
              <AutoHighlightNumberCell value={data?.cmdPauseTube ?? 0} />
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="solid">binlog</Badge>
            <Badge>
              current index
              <AutoHighlightNumberCell
                value={data?.binlogCurrentIndex ?? 0}
              />
            </Badge>
            <Badge>
              oldest index
              <AutoHighlightNumberCell value={data?.binlogOldestIndex ?? 0} />
            </Badge>
            <Badge>
              max size
              <AutoHighlightNumberCell value={data?.binlogMaxSize ?? 0} />
            </Badge>
            <Badge>
              records written
              <AutoHighlightNumberCell
                value={data?.binlogRecordsWritten ?? 0}
              />
            </Badge>
            <Badge>
              records migrated
              <AutoHighlightNumberCell
                value={data?.binlogRecordsMigrated ?? 0}
              />
            </Badge>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default function ServerStatsPage() {
  const { params } = useRoute();
  const { serverId } = params;
  const servers = useServerStore((s) => s.servers);
  const server = servers.find((s) => s.id === Number(serverId));

  if (!serverId || !server) return <NotFound />;

  return <ServerStats serverId={Number(serverId)} />;
}
