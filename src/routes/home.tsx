import { useQuery } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { DataTable } from '../components/datatable';
import { useTRPC } from '../utils/trpc';

export default function HomePage() {
  const trpc = useTRPC();
  const result = useQuery(trpc.tubes.list.queryOptions());
  const table = useReactTable<string>({
    columns: [
      { id: 'name', header: 'tube name', cell: (ctx) => ctx.row.original },
    ],
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
