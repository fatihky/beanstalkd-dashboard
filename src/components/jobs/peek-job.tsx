import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Accordion } from '@/components/retroui/Accordion';
import { Alert } from '@/components/retroui/Alert';
import { Badge } from '@/components/retroui/Badge';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';

export function PeekJob({
  serverId,
  state,
  tube,
}: {
  serverId: number;
  state: 'buried' | 'delayed' | 'ready';
  tube: string;
}) {
  const trpc = useTRPC();
  const result = useQuery(
    trpc.jobs[
      state === 'buried'
        ? 'peekBuried'
        : state === 'delayed'
          ? 'peekDelayed'
          : 'peekReady'
    ].queryOptions({
      serverId,
      tube,
    }),
  );

  return (
    <Card className="flex-1">
      <Card.Header>
        <Card.Title className="flex justify-between items-center text-sm">
          <div>
            Next job in <Badge>{state}</Badge> state
          </div>
          <div>
            <Button size="icon" onClick={() => result.refetch()}>
              <RefreshCw
                className={cn('w-3 h-3', result.isRefetching && 'animate-spin')}
              />
            </Button>
          </div>
        </Card.Title>
      </Card.Header>

      <Card.Content>
        {result.isPending ? (
          'Loading...'
        ) : result.isError ? (
          <Alert>{result.error.message}</Alert>
        ) : !result.data ? (
          <Alert>no jobs found</Alert>
        ) : (
          <div className="flex flex-col gap-2">
            <div>
              <Badge>jobId: {result.data.job.id}</Badge>
            </div>
            <Accordion type="multiple" defaultValue={['payload', 'stats']}>
              <Accordion.Item value="payload">
                <Accordion.Header>Payload</Accordion.Header>
                <Accordion.Content className="max-w-sm">
                  <pre className="overflow-scroll p-4 bg-secondary/5">
                    {result.data.job.payload}
                  </pre>
                </Accordion.Content>
              </Accordion.Item>

              <Accordion.Item value="stats">
                <Accordion.Header>Statistics</Accordion.Header>
                <Accordion.Content className="flex flex-col gap-1">
                  {/* stats */}
                  <Badge>delay: {result.data.stats.delay}</Badge>
                  <Badge>pri: {result.data.stats.pri}</Badge>
                  <Badge>timeLeft: {result.data.stats.timeLeft}</Badge>
                  <Badge>ttr: {result.data.stats.ttr}</Badge>
                  <hr />

                  {/* detailed stats */}
                  <Badge>age: {result.data.stats.age}</Badge>
                  <Badge>buries: {result.data.stats.buries}</Badge>
                  <Badge>kicks: {result.data.stats.kicks}</Badge>
                  <Badge>releases: {result.data.stats.releases}</Badge>
                  <Badge>reserves: {result.data.stats.reserves}</Badge>
                  <Badge>state: {result.data.stats.state}</Badge>
                  <Badge>timeouts: {result.data.stats.timeouts}</Badge>
                  <hr />

                  {/* extra */}
                  <Badge>file: {result.data.stats.file}</Badge>
                  <Badge>job id: {result.data.stats.id}</Badge>
                  <Badge>tube: {result.data.stats.tube}</Badge>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
