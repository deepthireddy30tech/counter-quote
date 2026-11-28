import { describe, expect, it } from 'vitest';
import { prices as testPrices } from '../test/prices';
import { layoutOf, newCounter, sampleJob, toQuoteJob, toQuotePrices, withLayout, withRoom, withSavedQuote } from './jobEditor';
import { priceJob } from './quote';

const prices = testPrices();

describe('the sample job', () => {
  it('prices as a Kitchen L with one undermount sink', () => {
    const quote = priceJob(toQuoteJob(sampleJob(3, 5)), toQuotePrices(prices), 'in');
    // 120 × 25.5 + (96 − 25.5) × 25.5 = 4,857.75 sq in = 33.7 sq ft, charged as 34 at $45
    expect(quote.errors).toEqual([]);
    expect(quote.items.map((x) => [x.counter, x.description, x.quantity, x.amount])).toEqual([
      ['Kitchen L', 'Steel Grey, 3 cm', 34, 1530],
      ['Kitchen L', 'Eased edge', 15.88, 0], // fronts 94.5 + 70.5, end 25.5 = 190.5 in
      ['Kitchen L', 'Undermount sink cutout', 1, 250],
      ['Kitchen L', 'Faucet hole', 1, 25],
    ]);
    expect(quote.total).toBe(1805);
  });
});

describe('toQuoteJob', () => {
  it('numbers each cutout by the leg it is nested in, and prices a blank requirement at $0', () => {
    const job = sampleJob(3, 5);
    job.counters[0].legs[1].cutouts.push({ kind: 'cooktop', centerline: 50, faucetHoles: 0 });
    job.additionalRequirements.push({ description: 'Outlet cutout', price: NaN });
    const q = toQuoteJob(job);
    expect(q.counters[0].cutouts.map((c) => [c.kind, c.leg])).toEqual([['undermount', 0], ['cooktop', 1]]);
    expect(q.counters[0].legs[1].turn).toBe(90);
    expect(q.additionalRequirements).toEqual([{ description: 'Outlet cutout', price: 0 }]);
  });
});

describe('layouts', () => {
  it('names a counter by its legs, and calls angled or longer chains Custom', () => {
    const c = newCounter('Kitchen', 3, 5);
    expect(layoutOf(c)).toBe('Straight');
    expect(layoutOf(withLayout(c, 'U'))).toBe('U');
    const angled = withLayout(c, 'L');
    angled.legs[1].turnAngle = 135;
    expect(layoutOf(angled)).toBe('Custom');
  });

  it('keeps the legs it can, squares their corners and adds legs as deep as the last', () => {
    const c = withLayout(newCounter('Kitchen', 3, 5), 'L');
    c.legs[1] = { ...c.legs[1], length: 80, depth: 30, turnAngle: 120 };
    const u = withLayout(c, 'U');
    expect(u.legs.map((l) => [l.length, l.depth, l.turnAngle])).toEqual([[96, 25.5, 90], [80, 30, 90], [96, 30, 90]]);
    expect(withLayout(u, 'Straight').legs).toEqual([u.legs[0]]);
  });
});

describe('withRoom', () => {
  it('gives an island the island depth with every edge exposed', () => {
    const c = withLayout(newCounter('Kitchen', 3, 5), 'L');
    c.legs[0].startCovered = true;
    const island = withRoom(c, 'Island');
    expect(island.legs.map((l) => [l.depth, l.backCovered, l.startCovered])).toEqual([[36, false, false], [36, false, false]]);
  });
});

describe('withSavedQuote', () => {
  it('stores the line items and total, valid for the price list’s days', () => {
    const job = sampleJob(3, 5);
    job.customerName = ' Ana Ruiz ';
    job.additionalRequirements = [{ description: ' ', price: 50 }, { description: 'Outlet cutout ', price: NaN }];
    const quote = priceJob(toQuoteJob(job), toQuotePrices(prices), 'in');
    const saved = withSavedQuote(job, quote, 30, new Date('2026-11-27T15:00:00Z'), '<svg/>');
    expect(saved).toMatchObject({ customerName: 'Ana Ruiz', total: 1805, savedAt: '2026-11-27T15:00:00.000Z', validUntil: '2026-12-27T15:00:00.000Z', quoteDrawingSvg: '<svg/>' });
    expect(saved.additionalRequirements).toEqual([{ description: 'Outlet cutout', price: 0 }]);
    expect(saved.lineItems).toHaveLength(5);
  });

  it('keeps the saved quote and its valid-until date when not re-priced', () => {
    const job = { ...sampleJob(3, 5), customerName: 'Ana ', total: 999, savedAt: '2026-11-01T00:00:00.000Z', validUntil: '2026-12-01T00:00:00.000Z', quoteDrawingSvg: '<svg>old</svg>' };
    expect(withSavedQuote(job, null, 30, new Date('2026-11-27T15:00:00Z'), null))
      .toMatchObject({ customerName: 'Ana', total: 999, quoteDrawingSvg: '<svg>old</svg>', savedAt: '2026-11-01T00:00:00.000Z', validUntil: '2026-12-01T00:00:00.000Z' });
    // a plan turned without re-pricing gets a fresh drawing
    expect(withSavedQuote(job, null, 30, new Date(), '<svg>new</svg>').quoteDrawingSvg).toBe('<svg>new</svg>');
  });

  it('keeps no quote for a job that can’t be priced', () => {
    const job = sampleJob(3, 5);
    job.counters[0].legs[0].length = 10; // the sink no longer fits
    const quote = priceJob(toQuoteJob(job), toQuotePrices(prices), 'in');
    expect(withSavedQuote(job, quote, 30, new Date(), '<svg/>')).toMatchObject({ total: null, savedAt: null, validUntil: null, quoteDrawingSvg: null, lineItems: [] });
  });
});
