import { useMutation, useQuery } from '@tanstack/react-query';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'preact/hooks';
import { Alert } from '@/components/retroui/Alert';
import { Badge } from '@/components/retroui/Badge';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { Dialog } from '@/components/retroui/Dialog';
import { Table } from '@/components/retroui/Table';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';

type JobState = 'buried' | 'delayed' | 'ready';

const states: JobState[] = ['ready', 'delayed', 'buried'];
const limits = [50, 100, 500, 1000];

function JobDetails({
  serverId,
  jobId,
  onDeleted,
}: {
  serverId: number;
  jobId: number;
  onDeleted: () => void;
}) {
  const trpc = useTRPC();
  const result = useQuery(trpc.jobs.get.queryOptions({ serverId, jobId }));
  const deleteJob = useMutation(
    trpc.jobs.delete.mutationOptions({ onSuccess: onDeleted }),
  );

  if (result.isPending) return <section className="p-3">Loading...</section>;

  if (result.isError)
    return <Alert className="m-3">{result.error.message}</Alert>;

  if (!result.data) return <Alert className="m-3">job not found</Alert>;

  const { job, stats } = result.data;

  return (
    <section className="flex flex-col gap-3 p-3">
      <pre className="overflow-auto max-h-80 p-4 bg-secondary/5 whitespace-pre-wrap break-all">
        {job.payload}
      </pre>

      <div className="flex flex-wrap gap-1">
        <Badge>state: {stats.state}</Badge>
        <Badge>pri: {stats.pri}</Badge>
        <Badge>age: {stats.age}</Badge>
        <Badge>delay: {stats.delay}</Badge>
        <Badge>ttr: {stats.ttr}</Badge>
        <Badge>timeLeft: {stats.timeLeft}</Badge>
        <Badge>reserves: {stats.reserves}</Badge>
        <Badge>timeouts: {stats.timeouts}</Badge>
        <Badge>releases: {stats.releases}</Badge>
        <Badge>buries: {stats.buries}</Badge>
        <Badge>kicks: {stats.kicks}</Badge>
      </div>

      <section className="flex w-full justify-end">
        <Button
          variant="danger"
          className="flex items-center gap-1"
          disabled={deleteJob.isPending}
          onClick={() => deleteJob.mutate({ serverId, jobId: job.id })}
        >
          <Trash2 className="w-4 h-4" />
          {deleteJob.isPending ? 'Deleting...' : 'Delete job'}
        </Button>
      </section>
      {deleteJob.isError && <Alert>{deleteJob.error.message}</Alert>}
    </section>
  );
}

/**
 * beanstalkd-pi extension: browse a tube's ready, delayed or buried jobs via
 * "list-jobs", instead of only seeing the next one in each state.
 */
export function JobList({
  serverId,
  tube,
}: {
  serverId: number;
  tube: string;
}) {
  const trpc = useTRPC();
  const [state, setState] = useState<JobState>('ready');
  const [limit, setLimit] = useState(100);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const result = useQuery(
    trpc.jobs.list.queryOptions({ serverId, tube, state, limit }),
  );

  return (
    <Card className="w-full mt-4">
      <Card.Header>
        <Card.Title className="flex flex-wrap justify-between items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span>Jobs</span>
            {states.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === state ? 'default' : 'outline'}
                onClick={() => setState(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span>limit</span>
            {limits.map((l) => (
              <Button
                key={l}
                size="sm"
                variant={l === limit ? 'default' : 'outline'}
                onClick={() => setLimit(l)}
              >
                {l}
              </Button>
            ))}
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
        ) : result.data.length === 0 ? (
          <Alert>no {state} jobs</Alert>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Job ID</Table.Head>
                  <Table.Head>Priority</Table.Head>
                  <Table.Head>Age (s)</Table.Head>
                  <Table.Head>Size (bytes)</Table.Head>
                  {state === 'delayed' && <Table.Head>Ready in (s)</Table.Head>}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {result.data.map((job) => (
                  <Table.Row
                    key={job.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <Table.Cell>{job.id}</Table.Cell>
                    <Table.Cell>{job.pri}</Table.Cell>
                    <Table.Cell>{job.age}</Table.Cell>
                    <Table.Cell>{job.size}</Table.Cell>
                    {state === 'delayed' && (
                      <Table.Cell>{job.timeLeft ?? '-'}</Table.Cell>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            {result.data.length >= limit && (
              <div className="text-xs p-2">
                showing the first {limit} {state} jobs
              </div>
            )}
          </div>
        )}
      </Card.Content>

      <Dialog
        open={selectedJobId !== null}
        onOpenChange={(open) => !open && setSelectedJobId(null)}
      >
        <Dialog.Content>
          <Dialog.Header>Job {selectedJobId}</Dialog.Header>
          {selectedJobId !== null && (
            <JobDetails
              serverId={serverId}
              jobId={selectedJobId}
              onDeleted={() => {
                setSelectedJobId(null);
                result.refetch();
              }}
            />
          )}
        </Dialog.Content>
      </Dialog>
    </Card>
  );
}
