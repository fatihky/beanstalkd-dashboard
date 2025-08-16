import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ListFilter } from 'lucide-react';
import { useMemo } from 'preact/hooks';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/retroui/Button';
import { Menu } from '@/components/retroui/Menu';
import { TubeActions } from '@/components/tubes/tube-actions';
import { useServerStore } from '@/server-store';
import type { TubeWithStats } from '../../server/router';
import { AutoHighlightNumberCell } from '../components/auto-highlight-number-cell';
import { DataTable } from '../components/datatable';
import { useTRPC } from '../utils/trpc';

export default function HomePage() {
  const trpc = useTRPC();
  const { selectedServerId: serverId } = useServerStore();
  const result = useQuery(
    trpc.tubes.list.queryOptions({ serverId }, { refetchInterval: 400 }),
  );
  const columns = useMemo<ColumnDef<TubeWithStats>[]>(
    () => [
      { id: 'name', header: 'tube name', cell: (ctx) => ctx.row.original.name },
      {
        id: 'cmdDelete',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.cmdDelete} />
        ),
        header: 'Deletes',
      },
      {
        id: 'cmdPauseTube',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.cmdPauseTube} />
        ),
        header: 'Pauses',
      },
      {
        id: 'currentJobsBuried',
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsBuried}
          />
        ),
        header: 'Buried Jobs',
      },
      {
        id: 'currentJobsDelayed',
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsDelayed}
          />
        ),
        header: 'Delayed Jobs',
      },
      {
        id: 'currentJobsReady',
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsReady}
          />
        ),
        header: 'Ready Jobs',
      },
      {
        id: 'currentJobsReserved',
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsReserved}
          />
        ),
        header: 'Reserved Jobs',
      },
      {
        id: 'currentJobsUrgent',
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsUrgent}
          />
        ),
        header: 'Urgent Jobs',
      },
      {
        id: 'currentUsing',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentUsing} />
        ),
        header: 'Producers',
      },
      {
        id: 'currentWaiting',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentWaiting} />
        ),
        header: 'Consumers Waiting',
      },
      {
        id: 'currentWatching',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentWatching} />
        ),
        header: 'Consumers',
      },
      {
        id: 'totalJobs',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.totalJobs} />
        ),
        header: 'Total Jobs',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({
          row: {
            original: { name, stats },
          },
        }) => (
          <TubeActions
            serverId={serverId}
            tube={name}
            pause={stats.pause}
            pauseTimeLeft={stats.pauseTimeLeft}
            onMutate={result.refetch}
          />
        ),
      },
    ],
    [result.refetch, serverId],
  );
  const table = useReactTable<TubeWithStats>({
    columns,
    data: result.data ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-3">
      <AppHeader />

      {/* tubes */}

      <div className="flex justify-between my-2 relative">
        <span className="text-xl">Tubes</span>
        <div>
          <Menu>
            <Menu.Trigger>
              <Button size="icon">
                <ListFilter className="w-4 h-4" />
              </Button>
            </Menu.Trigger>
            <Menu.Content className="min-w-36">
              {table.getAllColumns().map((column) => (
                <Menu.Item key={column.id}>
                  {column.columnDef.header ?? column.id}
                </Menu.Item>
              ))}
              <Menu.Item></Menu.Item>
            </Menu.Content>
          </Menu>
        </div>
      </div>

      <DataTable result={result} table={table} />
    </div>
  );
}
