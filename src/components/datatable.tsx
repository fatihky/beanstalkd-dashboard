import type { UseQueryResult } from '@tanstack/react-query';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Table } from './retroui/Table';

export function DataTable<RowData>({
  result,
  table,
}: {
  result: UseQueryResult<unknown, unknown>;
  table: TanstackTable<RowData>;
}) {
  return (
    <Table>
      <Table.Header>
        {table.getHeaderGroups().map((headerGroup) => (
          <Table.Row key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const isSortable = header.column.getCanSort();
              const isSorted = header.column.getIsSorted();
              const suffix = isSortable ? (
                isSorted === false ? (
                  <ArrowUpDown className="h-4 w-4 opacity-40 group-hover:opacity-70 transition-opacity" />
                ) : isSorted === 'asc' ? (
                  <ArrowUp className="h-4 w-4 text-gray-70" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-gray-70" />
                )
              ) : null;

              return (
                <Table.Head key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}

                  {suffix}
                </Table.Head>
              );
            })}
          </Table.Row>
        ))}
      </Table.Header>
      <Table.Body>
        {result.isLoading ? (
          <Table.Row>
            <Table.Cell>Loading...</Table.Cell>
          </Table.Row>
        ) : result.isError ? (
          <Table.Row>
            <Table.Cell>Failed to fetch.</Table.Cell>
          </Table.Row>
        ) : !result.data || table.getRowCount() === 0 ? (
          <Table.Row>
            <Table.Cell>No data</Table.Cell>
          </Table.Row>
        ) : (
          // render rows
          table
            .getRowModel()
            .rows.map((row) => (
              <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))
        )}
      </Table.Body>
    </Table>
  );
}
