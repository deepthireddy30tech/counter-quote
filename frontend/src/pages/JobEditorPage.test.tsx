// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createJob, getJob, getJobs, getPriceList, type Job, updateJob } from '../api';
import { sampleJob } from '../lib/jobEditor';
import { prices } from '../test/prices';
import { renderAt } from '../test/render';

vi.mock('../api');

/** Plan shapes by their SVG tooltip; getByTitle only finds a <title> directly under the <svg>. */
const byTitle = (text: string) => [...document.querySelectorAll('title')].filter((t) => t.textContent === text).map((t) => t.parentElement!);

const total = () => screen.getByText(/^\$|^—$/, { selector: '.total strong' }).textContent;

/** The sample Kitchen L, saved on 1 Nov at an older price of $1234.50. Today's prices give $1805.00. */
const savedJob = (changes: Partial<Job> = {}): Job => ({
  ...sampleJob(3, 5),
  id: 9,
  customerName: 'Ana Ruiz',
  total: 1234.5,
  savedAt: '2026-11-01T15:00:00.000Z',
  validUntil: '2099-12-01T15:00:00.000Z',
  lineItems: [{ counter: 'Kitchen L', description: 'Old saved line', quantity: 1, unit: 'job', rate: 1234.5, amount: 1234.5 }],
  ...changes,
});

beforeEach(() => {
  vi.mocked(getPriceList).mockResolvedValue(prices());
  vi.mocked(getJobs).mockResolvedValue([]);
  vi.mocked(createJob).mockImplementation(async (j) => ({ ...j, id: 12 }));
  vi.mocked(updateJob).mockImplementation(async (j) => j);
});

describe('a reopened job', () => {
  it('links to the PDF of its saved quote', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob());
    renderAt('/jobs/9');
    expect((await screen.findByRole('link', { name: 'PDF of saved quote' })).getAttribute('href')).toBe('/api/jobs/9/pdf');
  });

  it('shows its saved quote and a notice that today’s prices differ', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob());
    renderAt('/jobs/9');
    expect(await screen.findByText('Old saved line')).toBeTruthy();
    expect(total()).toBe('$1234.50');
    expect(screen.getByText(/Saved .*, valid until/)).toBeTruthy();
    expect(screen.getByText(/Prices have changed\. Saved total \$1234\.50; at today's prices \$1805\.00\./)).toBeTruthy();
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('shows no notice when today’s prices give the same total', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob({ total: 1805 }));
    renderAt('/jobs/9');
    await screen.findByText('Old saved line');
    expect(screen.queryByText(/Prices have changed/)).toBeNull();
  });

  it('switches to today’s prices on Re-price, which is an unsaved change', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob());
    renderAt('/jobs/9');
    await userEvent.click(await screen.findByRole('button', { name: 'Re-price' }));
    expect(total()).toBe('$1805.00');
    expect(screen.queryByText('Old saved line')).toBeNull();
    expect(screen.queryByText(/Prices have changed/)).toBeNull();
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
  });

  it('switches to today’s prices when the job is edited, but not when only the customer name is', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob());
    renderAt('/jobs/9');
    await userEvent.type(await screen.findByLabelText('Customer'), 'z');
    expect(total()).toBe('$1234.50');
    await userEvent.click(screen.getByLabelText('Tear-out of old counters'));
    expect(total()).toBe('$2205.00');
  });

  it('saves without re-pricing by keeping the saved quote and its valid-until date', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob());
    const confirm = vi.spyOn(window, 'confirm');
    renderAt('/jobs/9');
    await userEvent.click(await screen.findByRole('button', { name: 'Save job' }));
    expect(confirm).not.toHaveBeenCalled();
    const sent = vi.mocked(updateJob).mock.calls[0][0];
    expect(sent).toMatchObject({ total: 1234.5, validUntil: '2099-12-01T15:00:00.000Z' });
    expect(sent.lineItems.map((l) => l.description)).toEqual(['Old saved line']);
    expect(await screen.findByText(/Saved\. The quote is kept at the prices of .*, valid until/)).toBeTruthy();
  });

  it('saves a re-priced quote with a new valid-until date', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob());
    renderAt('/jobs/9');
    await userEvent.click(await screen.findByRole('button', { name: 'Re-price' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    const sent = vi.mocked(updateJob).mock.calls[0][0];
    expect(sent.total).toBe(1805);
    // the PDF's plan: every counter, by name, with no click targets
    expect(sent.quoteDrawingSvg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(sent.quoteDrawingSvg).toContain('>Kitchen L</text>');
    expect(sent.quoteDrawingSvg).not.toContain('class="hit"');
    const days = (Date.parse(sent.validUntil!) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29); // quoteValidDays is 30
    expect(days).toBeLessThanOrEqual(30);
    await waitFor(() => expect(screen.queryByText('Unsaved changes')).toBeNull());
  });

  it('asks before saving a quote past its valid-until date', async () => {
    vi.mocked(getJob).mockResolvedValue(savedJob({ validUntil: '2020-01-01T00:00:00.000Z' }));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAt('/jobs/9');
    expect(await screen.findByText(/no longer valid since/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/past its valid-until date/));
    expect(updateJob).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    expect(vi.mocked(updateJob).mock.calls[0][0]).toMatchObject({ total: 1234.5, validUntil: '2020-01-01T00:00:00.000Z' });
  });

  it('asks before a re-price that today’s price list can’t price wipes the saved quote', async () => {
    const job = savedJob();
    job.counters[0].materialId = 99; // since removed from the price list
    vi.mocked(getJob).mockResolvedValue(job);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAt('/jobs/9');
    expect(await screen.findByText(/at today's prices it can't be priced/)).toBeTruthy();
    expect(screen.getByRole('option', { name: 'No longer in the price list' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Re-price' }));
    expect(total()).toBe('—');
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/removes its saved quote of \$1234\.50/));
    expect(updateJob).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    expect(vi.mocked(updateJob).mock.calls[0][0]).toMatchObject({ total: null, lineItems: [], savedAt: null, validUntil: null });
  });

  it('says when the job or the price list can’t be loaded', async () => {
    vi.mocked(getJob).mockRejectedValue(new Error('Request failed (404)'));
    renderAt('/jobs/9');
    expect(await screen.findByText('Request failed (404)')).toBeTruthy();
  });
});

describe('a new job', () => {
  it('opens the sample Kitchen L priced from today’s list, and moves to its own address once saved', async () => {
    const router = renderAt('/jobs/new');
    expect(await screen.findByRole('tab', { name: 'Kitchen L' })).toBeTruthy();
    expect(total()).toBe('$1805.00');
    await userEvent.type(screen.getByLabelText('Customer'), ' Ana Ruiz ');
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    expect(vi.mocked(createJob).mock.calls[0][0]).toMatchObject({ customerName: 'Ana Ruiz', total: 1805 });
    await waitFor(() => expect(router.state.location.pathname).toBe('/jobs/12'));
    expect(await screen.findByText(/Saved\. The quote is kept/)).toBeTruthy();
  });

  it('won’t save while a size box is blank', async () => {
    renderAt('/jobs/new');
    await userEvent.clear(await screen.findByLabelText('Leg 1 length'));
    await userEvent.type(screen.getByLabelText('Customer'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    expect(screen.getByText(/Some sizes are empty or can't be read/)).toBeTruthy();
    expect(screen.getByLabelText('Leg 1 length').getAttribute('aria-invalid')).toBe('true');
    expect(createJob).not.toHaveBeenCalled();
  });

  it('shows an error for an address that isn’t a job', async () => {
    renderAt('/jobs/abc');
    expect(await screen.findByText('There is no job abc.')).toBeTruthy();
  });

  it('says why a save failed', async () => {
    vi.mocked(createJob).mockRejectedValue(new Error('A job can have at most 20 counters.'));
    renderAt('/jobs/new');
    await userEvent.type(await screen.findByLabelText('Customer'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Save job' }));
    expect(await screen.findByText('A job can have at most 20 counters.')).toBeTruthy();
  });
});

describe('editing a counter', () => {
  beforeEach(async () => {
    renderAt('/jobs/new');
    await screen.findByRole('tab', { name: 'Kitchen L' });
  });

  it('changes the layout, room, legs and sizes', async () => {
    await userEvent.selectOptions(screen.getByLabelText('Layout'), 'U');
    expect(screen.getByText('Leg 3', { selector: 'legend' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Remove leg 3' }));
    expect(screen.queryByText('Leg 3', { selector: 'legend' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: '+ Add leg' }));
    expect(screen.getByText('Leg 3', { selector: 'legend' })).toBeTruthy();
    fireEvent.change(screen.getAllByLabelText('Turn °')[1], { target: { value: '135' } });
    expect((screen.getByLabelText('Layout') as HTMLSelectElement).value).toBe('Custom');

    await userEvent.click(screen.getByRole('button', { name: 'Leg 1 length larger' }));
    expect((screen.getByLabelText('Leg 1 length') as HTMLInputElement).value).toBe('10′ 1″');
    await userEvent.click(screen.getByRole('button', { name: 'Leg 1 length smaller' }));
    expect((screen.getByLabelText('Leg 1 length') as HTMLInputElement).value).toBe('10′ 0″');
    await userEvent.click(screen.getByRole('button', { name: 'metres' }));
    expect((screen.getByLabelText('Leg 1 length') as HTMLInputElement).value).toBe('3.048 m');

    await userEvent.selectOptions(screen.getByLabelText('Room'), 'Island');
    expect((screen.getByLabelText('Leg 1 depth') as HTMLInputElement).value).toBe('91.4 cm');
  });

  it('changes the material, thickness, edge profile and backsplash', async () => {
    await userEvent.click(screen.getByRole('button', { name: '2 cm' }));
    expect(screen.getByText('Steel Grey, 2 cm')).toBeTruthy();
    await userEvent.selectOptions(screen.getByLabelText('Material'), 'Black Pearl');
    expect(screen.getByText('Black Pearl, 2 cm')).toBeTruthy();
    expect(screen.queryByText(/Ogee/, { selector: '.quote td' })).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText('Edge profile'), 'Ogee');
    expect(screen.getByText(/Ogee/, { selector: '.quote td' })).toBeTruthy();
    await userEvent.click(screen.getByLabelText(/backsplash on covered edges/));
    expect(screen.getByText(/backsplash/i, { selector: '.quote td' })).toBeTruthy();
  });

  it('adds, changes, moves and removes cutouts', async () => {
    await userEvent.click(screen.getByRole('button', { name: '+ Add cutout' }));
    expect(screen.getByText('Undermount sink 2')).toBeTruthy();
    const second = screen.getByText('Undermount sink 2').closest('fieldset')!;
    await userEvent.selectOptions(within(second).getByLabelText('Kind'), 'cooktop');
    const cooktop = screen.getByText('Cooktop 2').closest('fieldset')!;
    expect(within(cooktop).queryByLabelText('Faucet holes')).toBeNull();
    await userEvent.selectOptions(within(cooktop).getByLabelText('On leg'), 'Leg 2');
    const moved = screen.getByText(/^Cooktop \d+$/).closest('fieldset')!; // re-rendered under its new leg
    expect((within(moved).getByLabelText('On leg') as HTMLSelectElement).selectedOptions[0].textContent).toBe('Leg 2');
    fireEvent.change(within(screen.getByText('Undermount sink 1').closest('fieldset')!).getByLabelText('Faucet holes'), { target: { value: '3' } });
    expect(screen.getByText('Faucet hole', { selector: '.quote td *, .quote td' })).toBeTruthy();
    await userEvent.click(within(screen.getByText('Cooktop 2').closest('fieldset')!).getByRole('button', { name: 'Remove' }));
    expect(screen.queryByText('Cooktop 2')).toBeNull();
  });

  it('switches edges and corners from the plan or the folded boxes', async () => {
    await userEvent.click(byTitle('Leg 1 front: exposed')[0]);
    expect(byTitle('Leg 1 front: covered')).toHaveLength(1);
    await userEvent.click(screen.getByLabelText('Leg 1 front'));
    expect(byTitle('Leg 1 front: exposed')).toHaveLength(1);

    const corners = byTitle('Square corner');
    await userEvent.click(corners[0]);
    expect(byTitle('Radius corner')).toHaveLength(1);
    expect(screen.getByText('Radius corner', { selector: '.quote td *, .quote td' })).toBeTruthy();
    const box = screen.getAllByLabelText(/radius corner$/).find((b) => (b as HTMLInputElement).checked)!;
    await userEvent.click(box);
    expect(byTitle('Radius corner')).toHaveLength(0);
  });

  it('adds and removes counters and additional requirements', async () => {
    await userEvent.click(screen.getByRole('button', { name: '+ Add counter' }));
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Remove this counter' }));
    expect(screen.getAllByRole('tab')).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: '+ Add requirement' }));
    await userEvent.type(screen.getByLabelText('Requirement 1'), 'Haul away');
    await userEvent.type(screen.getByLabelText('Requirement 1 price'), '45');
    expect(total()).toBe('$1850.00');
    await userEvent.click(within(screen.getByLabelText('Requirement 1').parentElement!).getByRole('button', { name: 'Remove' }));
    expect(total()).toBe('$1805.00');
  });

  it('shows the Checks for a shape that can’t be priced', async () => {
    const length = screen.getByLabelText('Leg 1 length');
    await userEvent.clear(length);
    await userEvent.type(length, '10');
    expect(screen.getByText(/Leg 1 is too short for its corners/)).toBeTruthy();
    expect(screen.getByText(/No price until the shape is fixed/)).toBeTruthy();
    expect(total()).toBe('—');
  });
});

describe('the limits the API accepts', () => {
  it('stops offering + Add once a job, counter or leg is full', async () => {
    const job = savedJob();
    const [counter] = job.counters;
    const sink = { kind: 'undermount' as const, centerline: 30, faucetHoles: 1 };
    counter.legs[0].cutouts = Array.from({ length: 10 }, (_, i) => ({ ...sink, centerline: 20 + i * 6 }));
    counter.legs[1].cutouts = [];
    counter.legs.push(...Array.from({ length: 10 }, () => structuredClone(counter.legs[1])));
    job.counters = Array.from({ length: 20 }, () => structuredClone(counter));
    job.additionalRequirements = Array.from({ length: 50 }, (_, i) => ({ description: `Extra ${i + 1}`, price: 1 }));
    vi.mocked(getJob).mockResolvedValue(job);
    renderAt('/jobs/9');
    expect(await screen.findByText('20 counters is the most a job can have.')).toBeTruthy();
    expect(screen.getByText('12 legs is the most a counter can have.')).toBeTruthy();
    expect(screen.getByText(/Leg 1 has 10 cutouts, the most a leg can have/)).toBeTruthy();
    expect(screen.getByText('50 requirements is the most a job can have.')).toBeTruthy();
    for (const name of ['+ Add counter', '+ Add leg', '+ Add cutout', '+ Add requirement']) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
  });

  it('won’t move a cutout onto a full leg', async () => {
    const job = savedJob();
    const [counter] = job.counters;
    const sink = { kind: 'undermount' as const, centerline: 30, faucetHoles: 1 };
    counter.legs[0].cutouts = Array.from({ length: 10 }, (_, i) => ({ ...sink, centerline: 20 + i * 6 }));
    counter.legs[1].cutouts = [{ ...sink, centerline: 30 }];
    vi.mocked(getJob).mockResolvedValue(job);
    renderAt('/jobs/9');
    const last = (await screen.findAllByLabelText('On leg')).at(-1)! as HTMLSelectElement;
    expect([...last.options].map((o) => o.disabled)).toEqual([true, false]);
  });
});

describe('leaving with unsaved changes', () => {
  it('asks first, and stays if the salesperson cancels', async () => {
    const router = renderAt('/jobs/new');
    await userEvent.type(await screen.findByLabelText('Customer'), 'Ana');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await userEvent.click(screen.getByRole('link', { name: 'Jobs' }));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/Leave without saving/));
    expect(router.state.location.pathname).toBe('/jobs/new');
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('link', { name: 'Jobs' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('has the browser ask before the tab is closed', async () => {
    renderAt('/jobs/new');
    await userEvent.type(await screen.findByLabelText('Customer'), 'Ana');
    const event = new Event('beforeunload', { cancelable: true });
    act(() => { window.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
  });
});
