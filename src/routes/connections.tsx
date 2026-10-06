import { useQuery } from '@tanstack/react-query';
import { type ColumnDef, useTable } from '@tanstack/react-table';
import type { ConnectionStats } from 'beanstalkd-ts';
import { ArrowLeftCircle } from 'lucide-react';
import { useMemo } from 'preact/hooks';
import { useRoute } from 'preact-iso';
import { AppHeader } from '@/components/app-header';
import { DataTable } from '@/components/datatable';
import { Badge } from '@/components/retroui/Badge';
import { buttonVariants } from '@/components/retroui/Button';
import { type Features, features } from '@/lib/table';
import { cn } from '@/lib/utils';
import { useServerStore } from '@/server-store';
import { useTRPC } from '@/utils/trpc';
import { NotFound } from './404';

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <Badge variant={value ? 'solid' : 'default'} size="sm">
      {label}
    </Badge>
  );
}

function Connections({ serverId }: { serverId: number }) {
  const trpc = useTRPC();
  const result = useQuery(
    trpc.connections.list.queryOptions({ serverId }, { refetchInterval: 1000 }),
  );
  const columns = useMemo<ColumnDef<Features, ConnectionStats>[]>(
    () => [
      { id: 'id', header: 'ID', accessorFn: (row) => row.id },
      { id: 'addr', header: 'Address', accessorFn: (row) => row.addr },
      { id: 'tube', header: 'Using', accessorFn: (row) => row.tube },
      {
        id: 'watching',
        header: 'Watching',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.watching.map((tube) => (
              <Badge key={tube} size="sm">
                {tube}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'reservedJobs',
        header: 'Reserved Jobs',
        cell: ({ row }) =>
          row.original.reservedJobs.length === 0 ? (
            '-'
          ) : (
            <div className="flex flex-wrap gap-1">
              {row.original.reservedJobs.map((jobId) => (
                <Badge key={jobId} size="sm">
                  {jobId}
                </Badge>
              ))}
            </div>
          ),
      },
      {
        id: 'roles',
        header: 'Role',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <BoolBadge value={row.original.producer} label="producer" />
            <BoolBadge value={row.original.worker} label="worker" />
          </div>
        ),
      },
      {
        id: 'waiting',
        header: 'Waiting',
        cell: ({ row }) => (
          <BoolBadge value={row.original.waiting} label="waiting" />
        ),
      },
    ],
    [],
  );
  const table = useTable({
    features,
    columns,
    data: result.data ?? [],
  });

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
        <span>Connections</span>
      </div>

      <DataTable result={result} table={table} />
    </div>
  );
}

export default function ConnectionsPage() {
  const { params } = useRoute();
  const { serverId } = params;
  const servers = useServerStore((s) => s.servers);
  const server = servers.find((s) => s.id === Number(serverId));

  if (!serverId || !server) return <NotFound />;

  return <Connections serverId={Number(serverId)} />;
}
