import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'preact/hooks';
import { TubeActions } from '@/components/tubes/tube-actions';
import type { TubeWithStats } from '../../server/router';
import { DataTable } from '../components/datatable';
import { useTRPC } from '../utils/trpc';

export default function HomePage() {
  const trpc = useTRPC();
  const result = useQuery(
    trpc.tubes.list.queryOptions(void 0, {
      refetchInterval: 1000,
    }),
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
        }) => (
          <TubeActions
            name={name}
            pause={stats.pause}
            pauseTimeLeft={stats.pauseTimeLeft}
            onMutate={result.refetch}
          />
        ),
      },
    ],
    [result.refetch],
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
