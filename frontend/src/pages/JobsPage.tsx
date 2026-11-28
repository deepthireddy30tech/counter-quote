import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { deleteJob, getJobs, type Job } from '../api';

export function JobsPage() {
  const queryClient = useQueryClient();
  const { data: jobs, error } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const remove = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });
  const confirmDelete = (job: Job) => {
    if (window.confirm(`Delete the job for ${job.customerName}? This can't be undone.`)) remove.mutate(job.id);
  };

  if (error) return <p className="errors">{error.message}</p>;
  if (!jobs) return <p>Loading…</p>;

  return (
    <>
      <h1>Jobs</h1>
      {remove.error && <p className="errors">{remove.error.message}</p>}
      <table>
        <thead>
          <tr><th>#</th><th>Customer</th><th>Counters</th><th>Total</th><th /></tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td><Link to={`/jobs/${job.id}`}>{job.customerName}</Link></td>
              <td>{job.counters.length}</td>
              <td>{job.total == null ? 'Not priced' : `$${job.total.toFixed(2)}`}</td>
              <td>
                <button type="button" className="link" aria-label={`Delete the job for ${job.customerName}`}
                  disabled={remove.isPending} onClick={() => confirmDelete(job)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
