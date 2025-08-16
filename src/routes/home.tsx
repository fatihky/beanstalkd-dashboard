import { useMutation, useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Pause, Play } from 'lucide-react';
import { useMemo } from 'preact/hooks';
import type { TubeWithStats } from '../../server/router';
import { DataTable } from '../components/datatable';
import { Button } from '../components/retroui/Button';
import { useTRPC } from '../utils/trpc';

export default function HomePage() {
  const trpc = useTRPC();
  const result = useQuery(trpc.tubes.list.queryOptions());
  const pauseTube = useMutation(
    trpc.tubes.pause.mutationOptions({ onMutate: () => result.refetch() }),
  );
  const resumeTube = useMutation(
    trpc.tubes.resume.mutationOptions({ onMutate: () => result.refetch() }),
  );
  const columns = useMemo<ColumnDef<TubeWithStats>[]>(
    () => [
      { id: 'name', header: 'tube name', cell: (ctx) => ctx.row.original.name },
      {
        id: 'cmdDelete',
        cell: ({ row }) => row.original.stats.cmdDelete,
        header: 'Deletes',
      },
      {
        id: 'cmdPauseTube',
        cell: ({ row }) => row.original.stats.cmdPauseTube,
        header: 'Pauses',
      },
      {
        id: 'currentJobsBuried',
        cell: ({ row }) => row.original.stats.currentJobsBuried,
        header: 'Buried Jobs',
      },
      {
        id: 'currentJobsDelayed',
        cell: ({ row }) => row.original.stats.currentJobsDelayed,
        header: 'Delayed Jobs',
      },
      {
        id: 'currentJobsReady',
        cell: ({ row }) => row.original.stats.currentJobsReady,
        header: 'Ready Jobs',
      },
      {
        id: 'currentJobsReserved',
        cell: ({ row }) => row.original.stats.currentJobsReserved,
        header: 'Reserved Jobs',
      },
      {
        id: 'currentJobsUrgent',
        cell: ({ row }) => row.original.stats.currentJobsUrgent,
        header: 'Urgent Jobs',
      },
      {
        id: 'currentUsing',
        cell: ({ row }) => row.original.stats.currentUsing,
        header: 'Producers',
      },
      {
        id: 'currentWaiting',
        cell: ({ row }) => row.original.stats.currentWaiting,
        header: 'Consumers Waiting',
      },
      {
        id: 'currentWatching',
        cell: ({ row }) => row.original.stats.currentWatching,
        header: 'Consumers',
      },
      {
        id: 'totalJobs',
        cell: ({ row }) => row.original.stats.totalJobs,
        header: 'Total Jobs',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({
          row: {
            original: { name, stats },
          },
        }) => {
          const paused = stats.pause > 0 && stats.pauseTimeLeft > 0;

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
        },
      },
    ],
    [pauseTube, resumeTube],
  );
  const table = useReactTable<TubeWithStats>({
    columns,
    data: result.data ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-3">
      {/* tubes */}

      <span className="text-xl">Tubes</span>

      <DataTable result={result} table={table} />
    </div>
  );
}
