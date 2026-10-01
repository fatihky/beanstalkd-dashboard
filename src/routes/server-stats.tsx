import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftCircle, Ban, CirclePlay, Zap } from 'lucide-react';
import { useRoute } from 'preact-iso';
import { AppHeader } from '@/components/app-header';
import { AutoHighlightNumberCell } from '@/components/auto-highlight-number-cell';
import { Alert } from '@/components/retroui/Alert';
import { Badge } from '@/components/retroui/Badge';
import { Button, buttonVariants } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { hasExtension } from '@/lib/server-capabilities';
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

function PingButton({ serverId }: { serverId: number }) {
  const trpc = useTRPC();
  const ping = useMutation(trpc.servers.ping.mutationOptions());

  return (
    <Button
      size="sm"
      className="flex items-center gap-1"
      disabled={ping.isPending}
      onClick={() => ping.mutate({ serverId })}
    >
      <Zap className="w-3 h-3" />
      {ping.isPending
        ? 'Pinging...'
        : ping.data
          ? `pong in ${ping.data.latencyMs.toFixed(1)}ms`
          : 'Ping'}
    </Button>
  );
}

// beanstalkd-pi extension: drain mode rejects new puts while every other command keeps working.
function DrainButton({
  serverId,
  draining,
  onMutate,
}: {
  serverId: number;
  draining: boolean;
  onMutate: () => void;
}) {
  const trpc = useTRPC();
  const drain = useMutation(
    trpc.servers.drain.mutationOptions({ onSuccess: onMutate }),
  );

  return (
    <Button
      size="sm"
      variant={draining ? 'default' : 'danger'}
      className="flex items-center gap-1"
      disabled={drain.isPending}
      title={
        draining
          ? 'Accept new jobs again'
          : 'Reject new jobs (put / put-at); everything else keeps working'
      }
      onClick={() =>
        drain.mutate({ serverId, action: draining ? 'off' : 'on' })
      }
    >
      {draining ? (
        <CirclePlay className="w-3 h-3" />
      ) : (
        <Ban className="w-3 h-3" />
      )}
      {drain.isPending ? '...' : draining ? 'Stop draining' : 'Drain'}
    </Button>
  );
}

function ServerStats({ serverId }: { serverId: number }) {
  const trpc = useTRPC();
  const stats = useQuery(
    trpc.servers.stats.queryOptions({ serverId }, { refetchInterval: 1000 }),
  );
  const server = useServerStore((s) =>
    s.servers.find((srv) => srv.id === serverId),
  );
  const data = stats.data;
  const canPing = hasExtension(server?.capabilities, 'ping');
  const canDrain = hasExtension(server?.capabilities, 'drain');
  const draining = data?.draining === 'true';
  const isBeanstalkdPi = Boolean(server?.capabilities);

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
        <div className="flex items-center gap-2">
          {canDrain && data && (
            <DrainButton
              serverId={serverId}
              draining={draining}
              onMutate={stats.refetch}
            />
          )}
          {canPing && <PingButton serverId={serverId} />}
        </div>
      </div>

      {draining && (
        <Alert className="mb-3">
          Server is draining: new jobs (put / put-at) are rejected.
        </Alert>
      )}

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
            <Badge>draining {data?.draining ?? '-'}</Badge>
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
              <AutoHighlightNumberCell value={data?.currentJobsReserved ?? 0} />
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
              <AutoHighlightNumberCell value={data?.binlogCurrentIndex ?? 0} />
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

          {isBeanstalkdPi && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="surface">beanstalkd-pi</Badge>
              <Badge>version {server?.capabilities?.version ?? '-'}</Badge>
              <Badge>
                dead-lettered
                <AutoHighlightNumberCell value={data?.jobDeadLettered ?? 0} />
              </Badge>
              <Badge>
                put-at
                <AutoHighlightNumberCell value={data?.cmdPutAt ?? 0} />
              </Badge>
              <Badge>
                kick-tube
                <AutoHighlightNumberCell value={data?.cmdKickTube ?? 0} />
              </Badge>
              <Badge>
                delete-tube
                <AutoHighlightNumberCell value={data?.cmdDeleteTube ?? 0} />
              </Badge>
              <Badge>
                peek-tube
                <AutoHighlightNumberCell value={data?.cmdPeekTube ?? 0} />
              </Badge>
              <Badge>
                list-jobs
                <AutoHighlightNumberCell value={data?.cmdListJobs ?? 0} />
              </Badge>
              <Badge>
                list-tubes-paused
                <AutoHighlightNumberCell
                  value={data?.cmdListTubesPaused ?? 0}
                />
              </Badge>
              <Badge>
                stats-tube-all
                <AutoHighlightNumberCell value={data?.cmdStatsTubeAll ?? 0} />
              </Badge>
              <Badge>
                stats-conn
                <AutoHighlightNumberCell value={data?.cmdStatsConn ?? 0} />
              </Badge>
              <Badge>
                list-connections
                <AutoHighlightNumberCell
                  value={data?.cmdListConnections ?? 0}
                />
              </Badge>
              <Badge>
                set-dlq
                <AutoHighlightNumberCell value={data?.cmdSetDlq ?? 0} />
              </Badge>
              <Badge>
                drain
                <AutoHighlightNumberCell value={data?.cmdDrain ?? 0} />
              </Badge>
            </div>
          )}
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
