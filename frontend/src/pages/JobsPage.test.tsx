// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteJob, getJobs, type Job } from '../api';
import { sampleJob } from '../lib/jobEditor';
import { renderAt } from '../test/render';

vi.mock('../api');

const job = (id: number, customerName: string, total: number | null): Job => ({ ...sampleJob(3, 5), id, customerName, total });

beforeEach(() => {
  vi.mocked(getJobs).mockResolvedValue([job(2, 'Ana Ruiz', 1805), job(1, 'Ben Okafor', null)]);
  vi.mocked(deleteJob).mockResolvedValue();
});

describe('the jobs list', () => {
  it('lists each job with its saved total, linking to the editor', async () => {
    renderAt('/');
    expect((await screen.findByRole('link', { name: 'Ana Ruiz' })).getAttribute('href')).toBe('/jobs/2');
    expect(screen.getByText('$1805.00')).toBeTruthy();
    expect(screen.getByText('Not priced')).toBeTruthy();
  });

  it('deletes a job only after the salesperson confirms', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAt('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete the job for Ana Ruiz' }));
    expect(confirm).toHaveBeenCalledWith("Delete the job for Ana Ruiz? This can't be undone.");
    expect(deleteJob).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Delete the job for Ana Ruiz' }));
    expect(vi.mocked(deleteJob).mock.calls[0][0]).toBe(2);
    await waitFor(() => expect(getJobs).toHaveBeenCalledTimes(2)); // the list reloads
  });

  it('says why a delete or the list failed', async () => {
    vi.mocked(deleteJob).mockRejectedValue(new Error('Request failed (500)'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderAt('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete the job for Ben Okafor' }));
    expect(await screen.findByText('Request failed (500)')).toBeTruthy();

    vi.mocked(getJobs).mockRejectedValue(new Error('The server is down'));
    renderAt('/');
    expect(await screen.findByText('The server is down')).toBeTruthy();
  });
});
