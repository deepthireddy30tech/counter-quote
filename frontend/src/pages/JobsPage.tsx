import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getJobs } from '../api';

export function JobsPage() {
  const { data: jobs, error } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });

  if (error) return <p className="errors">{error.message}</p>;
  if (!jobs) return <p>Loading…</p>;

  return (
    <>
      <h1>Jobs</h1>
      <table>
        <thead>
          <tr><th>#</th><th>Customer</th><th>Counters</th><th>Total</th></tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td><Link to={`/jobs/${job.id}`}>{job.customerName}</Link></td>
              <td>{job.counters.length}</td>
              <td>{job.total == null ? 'Not priced' : `$${job.total.toFixed(2)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
