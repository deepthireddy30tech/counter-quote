// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPriceList, savePriceList } from '../api';
import { prices } from '../test/prices';
import { renderAt } from '../test/render';

vi.mock('../api');

beforeEach(() => {
  vi.mocked(getPriceList).mockResolvedValue(prices());
  // the server gives added rows their ids
  vi.mocked(savePriceList).mockImplementation(async (list) => ({
    ...list,
    priceGroups: list.priceGroups.map((g, i) => ({ ...g, id: g.id || 100 + i })),
    materials: list.materials.map((m, i) => ({ ...m, id: m.id || 200 + i })),
    edgeProfiles: list.edgeProfiles.map((e, i) => ({ ...e, id: e.id || 300 + i })),
  }));
});

describe('the price list page', () => {
  it('highlights a changed price with its old value, and saves it', async () => {
    renderAt('/price-list');
    const rate = await screen.findByLabelText('Granite 2 3 cm price per sq ft');
    fireEvent.change(rate, { target: { value: '48' } });
    expect(screen.getByLabelText('Granite 2 3 cm price per sq ft (changed, was $45)')).toBeTruthy();
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Eased price per linear ft'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText(/^Quote valid for/), { target: { value: '45' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save price list' }));
    const sent = vi.mocked(savePriceList).mock.calls[0][0];
    expect(sent.priceGroups[0].rates.find((r) => r.thickness === 3)!.pricePerSqFt).toBe(48);
    expect(sent.edgeProfiles[0].pricePerLinearFt).toBe(12);
    expect(sent.fees.find((f) => f.kind === 'quoteValidDays')!.amount).toBe(45);
    expect(await screen.findByText(/Saved\. New quotes use these prices/)).toBeTruthy();
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('adds rows, and refuses to save until each has a name and prices', async () => {
    renderAt('/price-list');
    await userEvent.click(await screen.findByRole('button', { name: '+ Add price group' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Add material' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Add edge profile' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save price list' }));
    expect(screen.getByText('Every price group needs a name.')).toBeTruthy();
    expect(savePriceList).not.toHaveBeenCalled();

    await userEvent.type(screen.getAllByLabelText('Price group name')[1], 'Quartz 1');
    fireEvent.change(screen.getByLabelText('Quartz 1 2 cm price per sq ft (changed, new)'), { target: { value: '55' } });
    fireEvent.change(screen.getByLabelText('Quartz 1 3 cm price per sq ft (changed, new)'), { target: { value: '65' } });
    await userEvent.type(screen.getAllByLabelText('Material name').at(-1)!, 'Calacatta');
    await userEvent.selectOptions(screen.getByLabelText('Calacatta price group'), 'Granite 2');
    await userEvent.type(screen.getAllByLabelText('Edge profile name').at(-1)!, 'Bullnose');
    fireEvent.change(screen.getByLabelText('Bullnose price per linear ft (changed, new)'), { target: { value: '25' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save price list' }));
    const sent = vi.mocked(savePriceList).mock.calls[0][0];
    expect(sent.priceGroups.map((g) => g.name)).toEqual(['Granite 2', 'Quartz 1']);
    expect(sent.materials.map((m) => [m.name, m.priceGroupId])).toEqual([['Steel Grey', 7], ['Black Pearl', 7], ['Calacatta', 7]]);
  });

  it('drops a new row at once, and marks a saved one for removal with an Undo', async () => {
    renderAt('/price-list');
    await userEvent.click(await screen.findByRole('button', { name: '+ Add edge profile' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove new Edge profile' }));
    expect(screen.getAllByLabelText('Edge profile name')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Steel Grey' }));
    expect(screen.getByText('Removed when you save')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Undo removing Steel Grey' }));
    expect(screen.queryByText('Removed when you save')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Steel Grey' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save price list' }));
    expect(vi.mocked(savePriceList).mock.calls[0][0].materials.map((m) => m.name)).toEqual(['Black Pearl']);
  });

  it('says why loading or saving failed', async () => {
    vi.mocked(savePriceList).mockRejectedValue(new Error('A material still used by a saved job can’t be removed.'));
    renderAt('/price-list');
    fireEvent.change(await screen.findByLabelText('Eased price per linear ft'), { target: { value: '12' } });
    await userEvent.click(screen.getByRole('button', { name: 'Save price list' }));
    expect(await screen.findByText('A material still used by a saved job can’t be removed.')).toBeTruthy();

    vi.mocked(getPriceList).mockRejectedValue(new Error('The server is down'));
    renderAt('/price-list');
    expect(await screen.findByText('The server is down')).toBeTruthy();
  });
});
