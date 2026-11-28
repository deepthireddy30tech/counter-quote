import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteJob, getJobs, updateJob } from './api';
import { sampleJob } from './lib/jobEditor';

const respond = (status: number, body?: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body === undefined ? null : JSON.stringify(body), { status }));

afterEach(() => { vi.restoreAllMocks(); });

describe('the API client', () => {
  it('sends JSON and reads JSON back', async () => {
    const fetch = respond(200, { ...sampleJob(3, 5), id: 4 });
    expect((await updateJob({ ...sampleJob(3, 5), id: 4 })).id).toBe(4);
    const [path, init] = fetch.mock.calls[0];
    expect([path, init?.method, (init?.headers as Record<string, string>)['Content-Type']]).toEqual(['/api/jobs/4', 'PUT', 'application/json']);
  });

  it('reads nothing from a 204', async () => {
    respond(204);
    expect(await deleteJob(4)).toBeUndefined();
  });

  it('turns the server’s validation errors into one message', async () => {
    respond(400, { title: 'One or more validation errors occurred.', errors: { Counters: ['A job can have at most 20 counters.'], CustomerName: ['Required.'] } });
    await expect(getJobs()).rejects.toThrow('A job can have at most 20 counters. Required.');
  });

  it('falls back to the problem title, then the status', async () => {
    respond(404, { title: 'Not Found' });
    await expect(getJobs()).rejects.toThrow('Not Found');
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(getJobs()).rejects.toThrow('Request failed (502)');
  });
});
