import { useMutation, useQuery } from '@tanstack/react-query';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'preact/hooks';
import { toast } from 'sonner';
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
const removeAnimationMs = 300; // keep in sync with the row's duration-300

function withId(ids: ReadonlySet<number>, id: number) {
  return new Set(ids).add(id);
}

function withoutId(ids: ReadonlySet<number>, id: number) {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

function JobDetails({
  serverId,
  jobId,
  onDelete,
}: {
  serverId: number;
  jobId: number;
  onDelete: (jobId: number) => void;
}) {
  const trpc = useTRPC();
  const result = useQuery(trpc.jobs.get.queryOptions({ serverId, jobId }));
  const [confirming, setConfirming] = useState(false);

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

      {confirming ? (
        <section className="flex flex-wrap items-center justify-end gap-2">
          <span className="mr-auto">
            Job <Badge>{job.id}</Badge> will be{' '}
            <span className="font-bold">DELETED</span>. Are you sure?
          </span>
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onDelete(job.id)}>
            Confirm
          </Button>
        </section>
      ) : (
        <section className="flex w-full justify-end">
          <Button
            variant="danger"
            className="flex items-center gap-1"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="w-4 h-4" />
            Delete job
          </Button>
        </section>
      )}
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
  // lives here rather than in the modal, so it outlives the modal closing
  // jobs with a delete in flight (dimmed) and deleted ones animating out
  const [deletingIds, setDeletingIds] = useState<ReadonlySet<number>>(
    new Set(),
  );
  const [removedIds, setRemovedIds] = useState<ReadonlySet<number>>(new Set());
  const deleteJob = useMutation(
    trpc.jobs.delete.mutationOptions({
      onMutate: ({ jobId }) => setDeletingIds((ids) => withId(ids, jobId)),
      onSuccess: (_data, { jobId }) => {
        const job = result.data?.find((j) => j.id === jobId);
        toast.success('Job deleted', {
          description: (
            <span>
              id: <strong>{jobId}</strong>
              {job != null && (
                <>
                  {' '} pri: <strong>{job.pri}</strong>{' '}
                  age: <strong>{job.age}s</strong>{' '}
                  size: <strong>{job.size}b</strong>
                </>
              )}
            </span>
          ),
        });
        setRemovedIds((ids) => withId(ids, jobId));
        // let the row fade out before it drops from the list
        setTimeout(async () => {
          await result.refetch();
          setRemovedIds((ids) => withoutId(ids, jobId));
        }, removeAnimationMs);
      },
      onError: () => result.refetch(),
      onSettled: (_data, _error, { jobId }) =>
        setDeletingIds((ids) => withoutId(ids, jobId)),
    }),
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
        {deleteJob.isError && (
          <Alert className="mb-3">
            failed to delete job {deleteJob.variables?.jobId}:{' '}
            {deleteJob.error.message}
          </Alert>
        )}
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
                    className={cn(
                      'cursor-pointer transition-all duration-300',
                      deletingIds.has(job.id) && 'opacity-50 animate-pulse',
                      removedIds.has(job.id) &&
                        'opacity-0 -translate-x-8 pointer-events-none',
                    )}
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
              onDelete={(jobId) => {
                setSelectedJobId(null);
                deleteJob.mutate({ serverId, jobId });
              }}
            />
          )}
        </Dialog.Content>
      </Dialog>
    </Card>
  );
}
