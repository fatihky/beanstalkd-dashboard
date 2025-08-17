import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, ListFilter, X } from 'lucide-react';
import { useEffect, useMemo } from 'preact/hooks';
import { AppHeader } from '@/components/app-header';
import { Button, buttonVariants } from '@/components/retroui/Button';
import { Menu } from '@/components/retroui/Menu';
import { TubeActions } from '@/components/tubes/tube-actions';
import { usePreferencesStore } from '@/preferences-store';
import { useServerStore } from '@/server-store';
import type { TubeWithStats } from '../../server/router';
import { AutoHighlightNumberCell } from '../components/auto-highlight-number-cell';
import { DataTable } from '../components/datatable';
import { useTRPC } from '../utils/trpc';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const trpc = useTRPC();
  const serverStore = useServerStore();
  const serverId = serverStore.selectedServerId;
  const serverAddress =
    serverStore.servers.find((s) => s.id === serverId)?.address ?? '-';
  const result = useQuery(
    trpc.tubes.list.queryOptions({ serverId }, { refetchInterval: 400 }),
  );
  const prefs = usePreferencesStore();
  const columns = useMemo<ColumnDef<TubeWithStats>[]>(
    () => [
      {
        id: 'name',
        header: 'Tube',
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
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsUrgent}
          />
        ),
        header: 'Urgent Jobs',
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
        id: 'currentJobsDelayed',
        cell: ({ row }) => (
          <AutoHighlightNumberCell
            value={row.original.stats.currentJobsDelayed}
          />
        ),
        header: 'Delayed Jobs',
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
        id: 'currentUsing',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentUsing} />
        ),
        header: 'Producers',
      },
      {
        id: 'currentWatching',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentWatching} />
        ),
        header: 'Consumers',
      },
      {
        id: 'currentWaiting',
        cell: ({ row }) => (
          <AutoHighlightNumberCell value={row.original.stats.currentWaiting} />
        ),
        header: 'Consumers Waiting',
      },
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
            serverAddress={serverAddress}
            serverId={serverId}
            tube={name}
            pause={stats.pause}
            pauseTimeLeft={stats.pauseTimeLeft}
            onMutate={result.refetch}
          />
        ),
      },
    ],
    [result.refetch, serverAddress, serverId],
  );
  const table = useReactTable<TubeWithStats>({
    columns,
    data: result.data ?? [],
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility: prefs.tubeListColumnVisibility },
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
