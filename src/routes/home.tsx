import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, ListFilter, X } from 'lucide-react';
import { useEffect, useMemo } from 'preact/hooks';
import { AppHeader } from '@/components/app-header';
import { Button, buttonVariants } from '@/components/retroui/Button';
import { Menu } from '@/components/retroui/Menu';
import { TubeActions } from '@/components/tubes/tube-actions';
import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/preferences-store';
import { useServerStore } from '@/server-store';
import type { TubeWithStats } from '../../server/router';
import { AutoHighlightNumberCell } from '../components/auto-highlight-number-cell';
import { DataTable } from '../components/datatable';
import { useTRPC } from '../utils/trpc';

export default function HomePage() {
  const trpc = useTRPC();
  const serverStore = useServerStore();
  const serverId = serverStore.selectedServerId;
  const selectedServer = serverStore.servers.find((s) => s.id === serverId);
  const serverAddress = selectedServer?.address ?? '-';
  const capabilities = selectedServer?.capabilities ?? null;
  const result = useQuery(
    trpc.tubes.list.queryOptions({ serverId }, { refetchInterval: 400 }),
  );
  const prefs = usePreferencesStore();
  const columns = useMemo<ColumnDef<TubeWithStats>[]>(
    () => [
      {
        id: 'name',
        header: 'Tube',
        accessorFn: (row) => row.name,
        cell: (ctx) => (
          <a
            className={cn(buttonVariants({ variant: 'link' }), 'text-sm')}
            href={`/servers/${serverId}/tubes/${ctx.row.original.name}`}
          >
            {ctx.row.original.name}
          </a>
        ),
      },
      {
        id: 'currentJobsUrgent',
        accessorFn: (row) => row.stats.currentJobsUrgent,
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsUrgent}
          />
        ),
        header: 'Urgent Jobs',
      },
      {
        id: 'currentJobsReady',
        accessorFn: (row) => row.stats.currentJobsReady,
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsReady}
          />
        ),
        header: 'Ready Jobs',
      },
      {
        id: 'currentJobsReserved',
        accessorFn: (row) => row.stats.currentJobsReserved,
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsReserved}
          />
        ),
        header: 'Reserved Jobs',
      },
      {
        id: 'currentJobsDelayed',
        accessorFn: (row) => row.stats.currentJobsDelayed,
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsDelayed}
          />
        ),
        header: 'Delayed Jobs',
      },
      {
        id: 'currentJobsBuried',
        accessorFn: (row) => row.stats.currentJobsBuried,
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsBuried}
          />
        ),
        header: 'Buried Jobs',
      },
      {
        id: 'currentUsing',
        accessorFn: (row) => row.stats.currentUsing,
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentUsing} />
        ),
        header: 'Producers',
      },
      {
        id: 'currentWatching',
        accessorFn: (row) => row.stats.currentWatching,
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentWatching} />
        ),
        header: 'Consumers',
      },
      {
        id: 'currentWaiting',
        accessorFn: (row) => row.stats.currentWaiting,
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentWaiting} />
        ),
        header: 'Consumers Waiting',
      },
      {
        id: 'cmdDelete',
        accessorFn: (row) => row.stats.cmdDelete,
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.cmdDelete} />
        ),
        header: 'Deletes',
      },
      {
        id: 'cmdPauseTube',
        accessorFn: (row) => row.stats.cmdPauseTube,
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.cmdPauseTube} />
        ),
        header: 'Pauses',
      },
      {
        id: 'totalJobs',
        accessorFn: (row) => row.stats.totalJobs,
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.totalJobs} />
        ),
        header: 'Total Jobs',
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({
          row: {
            original: { name, stats },
          },
        }) => (
          <TubeActions
            serverAddress={serverAddress}
            serverId={serverId}
            tube={name}
            pause={stats.pause}
            pauseTimeLeft={stats.pauseTimeLeft}
            capabilities={capabilities}
            dlqMaxAttempts={stats.dlqMaxAttempts}
            dlqTube={stats.dlqTube}
            onMutate={result.refetch}
          />
        ),
      },
    ],
    [result.refetch, serverAddress, serverId, capabilities],
  );
  const table = useReactTable<TubeWithStats>({
    columns,
    data: result.data ?? [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function'
          ? updater(prefs.tubeListSorting)
          : updater;
      prefs.setSorting('tubeListSorting', newSorting);
    },
    state: {
      columnVisibility: prefs.tubeListColumnVisibility,
      sorting: prefs.tubeListSorting,
    },
  });

  useEffect(() => {
    const state = prefs.tubeListColumnVisibility;
    let update = false;

    columns.forEach((col) => {
      if (!col.id) return;

      if (!(col.id in state)) {
        update = true;
        state[col.id] = true;
      }
    });

    if (update) {
      prefs.setVisibility('tubeListColumnVisibility', {
        ...prefs.tubeListColumnVisibility,
        ...state,
      });
    }
  }, [columns, prefs]);

  return (
    <div className="p-3">
      <AppHeader />

      {/* tubes */}

      <div className="flex items-center gap-4 my-2">
        <Menu>
          <Menu.Trigger asChild>
            <Button size="icon">
              <ListFilter className="w-4 h-4" />
            </Button>
          </Menu.Trigger>
          <Menu.Content className="min-w-36">
            {table.getAllColumns().map((column) => (
              <Menu.Item
                key={column.id}
                className={cn(
                  'flex justify-between',
                  column.getIsVisible() ? 'bg-primary/40' : 'bg-primary/5',
                )}
                onClick={() =>
                  prefs.setVisibility('tubeListColumnVisibility', {
                    ...prefs.tubeListColumnVisibility,
                    [column.id]: !column.getIsVisible(),
                  })
                }
              >
                <span>{column.columnDef.header ?? column.id}</span>
                {column.getIsVisible() ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </Menu.Item>
            ))}
            <Menu.Item></Menu.Item>
          </Menu.Content>
        </Menu>
        <span className="text-xl">Tubes</span>
      </div>

      <DataTable result={result} table={table} />
    </div>
  );
}
