import { useQuery } from '@tanstack/react-query';
import { Table } from '../components/retroui/Table';
import { useTRPC } from '../utils/trpc';

export default function HomePage() {
  const trpc = useTRPC();
  const result = useQuery(trpc.tubes.list.queryOptions());

  return (
    <div className="p-3">
      {/* tubes */}

      <span className="text-xl">Tubes</span>

      <Table>
        <Table.Caption>tube statistics</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head>tube name</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {result.isLoading ? (
            <Table.Row>
              <Table.Cell>Loading...</Table.Cell>{' '}
            </Table.Row>
          ) : result.isError ? (
            <Table.Row>
              <Table.Cell>Failed to fetch tubes.</Table.Cell>{' '}
            </Table.Row>
          ) : !result.data || result.data.length === 0 ? (
            <Table.Row>
              <Table.Cell>No tubes found</Table.Cell>{' '}
            </Table.Row>
          ) : (
            result.data.map((t) => (
              <Table.Row key={t}>
                <Table.Cell>{t}</Table.Cell>{' '}
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </div>
  );
}
