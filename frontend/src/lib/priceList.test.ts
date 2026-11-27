import { describe, expect, it } from 'vitest';
import type { PriceList } from '../api';
import { priceListProblems } from './priceList';

const list = (): PriceList => ({
  priceGroups: [
    { id: 1, name: 'Granite 2', rates: [{ thickness: 2, pricePerSqFt: 35 }, { thickness: 3, pricePerSqFt: 45 }] },
    { id: 2, name: 'Quartz 1', rates: [{ thickness: 2, pricePerSqFt: 55 }, { thickness: 3, pricePerSqFt: 65 }] },
  ],
  materials: [{ id: 1, name: 'Steel Grey', priceGroupId: 1 }],
  edgeProfiles: [{ id: 1, name: 'Ogee', pricePerLinearFt: 25 }],
  fees: [{ id: 1, kind: 'seam', amount: 0 }, { id: 2, kind: 'quoteValidDays', amount: 30 }],
});

describe('priceListProblems', () => {
  it('finds nothing wrong with a complete price list', () => {
    expect(priceListProblems(list())).toEqual([]);
  });

  it('asks for a name on every row', () => {
    const l = list();
    l.priceGroups[1].name = ' ';
    l.materials.push({ id: 0, name: '', priceGroupId: 1 });
    l.edgeProfiles[0].name = '';
    expect(priceListProblems(l)).toEqual([
      'Every price group needs a name.',
      'Every material needs a name.',
      'Every edge profile needs a name.',
    ]);
  });

  it('refuses two rows with the same name, ignoring case and spaces', () => {
    const l = list();
    l.materials.push({ id: 0, name: ' steel grey', priceGroupId: 2 });
    expect(priceListProblems(l)).toEqual(['Two materials are called Steel Grey.']);
  });

  it('refuses missing or negative prices', () => {
    const l = list();
    l.priceGroups[0].rates[1].pricePerSqFt = NaN;
    l.edgeProfiles[0].pricePerLinearFt = -5;
    l.fees[0].amount = NaN;
    expect(priceListProblems(l)).toEqual([
      'Granite 2 needs a 3 cm price of $0 or more.',
      'Ogee needs a price of $0 or more.',
      'Seam needs an amount of $0 or more.',
    ]);
  });

  it('needs a price group for every material', () => {
    const l = list();
    l.materials[0].priceGroupId = 0;
    expect(priceListProblems(l)).toEqual(['Steel Grey needs a price group.']);
  });

  it('needs quotes to stay valid for a whole number of days', () => {
    const l = list();
    l.fees[1].amount = 0.5;
    expect(priceListProblems(l)).toEqual(['Quotes must stay valid for a whole number of days, at least 1.']);
  });
});
