import { describe, expect, it } from 'vitest';
import { priceJob, type Counter, type CounterLeg, type Job, type PriceList } from './quote';

const prices: PriceList = {
  priceGroups: [
    { id: 'g2', name: 'Granite · Level 2', pricePerSqFt: { 2: 48, 3: 58 } },
    { id: 'q1', name: 'Quartz · Level 1', pricePerSqFt: { 2: 55, 3: 65 } },
  ],
  materials: [
    { id: 'steel', name: 'Steel Grey', priceGroupId: 'g2' },
    { id: 'arctic', name: 'Arctic White', priceGroupId: 'q1' },
  ],
  edgeProfiles: [
    { id: 'eased', name: 'Eased', pricePerLinearFt: 0 },
    { id: 'ogee', name: 'Ogee', pricePerLinearFt: 25 },
  ],
  fees: {
    undermount: 250, dropin: 100, farmhouse: 200, cooktop: 150, faucetHole: 25, radiusCorner: 12,
    backsplash: 20, seam: 0, templating: 150, tearOut: 400, minimum: 800,
  },
};

const leg = (length: number, depth: number, turn: number, more: Partial<CounterLeg> = {}): CounterLeg => ({
  length, depth, turn,
  backCovered: true, frontCovered: false, startCovered: true, endCovered: false,
  startFrontRadius: false, startBackRadius: false, endFrontRadius: false, endBackRadius: false,
  ...more,
});

// Kitchen L: 10' and 8' along the walls, 25 1/2" deep, wall at the back and at the start
const kitchenL = (more: Partial<Counter> = {}): Counter => ({
  room: 'Kitchen', materialId: 'steel', thickness: 3, edgeProfileId: 'ogee', backsplash: true,
  legs: [leg(120, 25.5, 0), leg(96, 25.5, 90, { endFrontRadius: true, endBackRadius: true })],
  cutouts: [{ kind: 'undermount', leg: 0, centerline: 60, faucetHoles: 3 }],
  ...more,
});
const job = (more: Partial<Job> = {}): Job => ({ counters: [kitchenL()], tearOut: false, additionalRequirements: [], ...more });
const lines = (j: Job, counter = 'Kitchen L') =>
  priceJob(j, prices, 'in').items.filter((x) => x.counter === counter).map((x) => [x.description, x.quantity, x.rate, x.amount]);

describe('priceJob: counter line items', () => {
  it('prices every part of a kitchen L', () => {
    expect(lines(job())).toEqual([
      // 25.5 × 216 − 25.5² = 4857.75 sq in = 33.73 sq ft, rounded up
      ['Steel Grey, 3 cm', 34, 58, 1972],
      // exposed: front 94.5 + 70.5, end 25.5 = 190.5" = 15.88 lf
      ['Ogee edge', 15.88, 25, 397],
      ['Undermount sink cutout', 1, 250, 250],
      ['Faucet hole', 3, 25, 75],
      // the end-back corner is against the wall, so only the front one is rounded
      ['Radius corner', 1, 12, 12],
      // covered: back 120 + 96, start 25.5 = 241.5" = 20.13 lf
      ['4″ backsplash', 20.13, 20, 402.6],
    ]);
  });

  it('uses the 2 cm rate for a 2 cm counter', () => {
    expect(lines(job({ counters: [kitchenL({ thickness: 2 })] }))[0]).toEqual(['Steel Grey, 2 cm', 34, 48, 1632]);
  });

  it('rounds each counter up separately', () => {
    const island: Counter = kitchenL({
      room: 'Island', backsplash: false, cutouts: [], edgeProfileId: 'eased',
      legs: [leg(72, 36, 0, { backCovered: false, startCovered: false })], // 18 sq ft exactly
    });
    const areas = priceJob(job({ counters: [kitchenL(), island] }), prices, 'in').items.filter((x) => x.unit === 'sq ft');
    expect(areas.map((x) => [x.counter, x.quantity])).toEqual([['Kitchen L', 34], ['Island', 18]]);
  });

  it('lists an included edge profile at $0 and leaves out lines with nothing to charge', () => {
    const plain = kitchenL({ edgeProfileId: 'eased', backsplash: false, cutouts: [], legs: [leg(120, 25.5, 0)] });
    expect(lines(job({ counters: [plain] }), 'Kitchen')).toEqual([
      ['Steel Grey, 3 cm', 22, 58, 1276],
      ['Eased edge', 12.13, 0, 0],
    ]);
  });
});

describe('priceJob: job lines and total', () => {
  const jobLines = (j: Job) => lines(j, 'Job').map(([d, , , a]) => [d, a]);

  it('adds templating once for the job and totals every line', () => {
    const q = priceJob(job(), prices, 'in');
    expect(jobLines(job())).toEqual([['Templating visit', 150]]);
    expect(q.total).toBe(3258.6); // 3108.60 kitchen L + 150
  });

  it('adds tear-out when asked', () => {
    expect(jobLines(job({ tearOut: true }))).toEqual([['Templating visit', 150], ['Tear-out of old counters', 400]]);
  });

  it('adds each additional requirement that has a description, never below $0', () => {
    const j = job({
      additionalRequirements: [
        { description: '  Extra outlet cutout ', price: 45 },
        { description: '   ', price: 99 },
        { description: 'Seal the stone', price: 0 },
        { description: 'Typo', price: -5 },
      ],
    });
    expect(jobLines(j)).toEqual([['Templating visit', 150], ['Extra outlet cutout', 45], ['Seal the stone', 0], ['Typo', 0]]);
    expect(priceJob(j, prices, 'in').total).toBe(3303.6);
  });

  it('raises a small job to the minimum charge with its own line', () => {
    // 30 × 22 vanity = 660 sq in = 4.58, rounded up to 5 sq ft × $58 = $290; + $150 templating = $440
    const vanity: Counter = kitchenL({
      room: 'Bathroom', edgeProfileId: 'eased', backsplash: false, cutouts: [],
      legs: [leg(30, 22, 0, { endCovered: true })],
    });
    const j = job({ counters: [vanity] });
    expect(jobLines(j)).toEqual([['Templating visit', 150], ['Minimum job charge', 360]]);
    expect(priceJob(j, prices, 'in').total).toBe(800);
  });
});

describe('priceJob: impossible shapes and cutout fit', () => {
  const quote = (c: Counter) => priceJob(job({ counters: [c] }), prices, 'in');
  const sink = (centerline: number, more = {}) => ({ kind: 'undermount' as const, leg: 0, centerline, faucetHoles: 1, ...more });

  it('stops the quote when a counter has an impossible shape', () => {
    const q = quote(kitchenL({ legs: [leg(120, 25.5, 0), leg(20, 25.5, 90)] }));
    expect(q.errors).toEqual(['Kitchen L: Leg 2 is too short for its corners. Make it longer or the depth smaller.']);
    expect(q.total).toBeNull();
    expect(q.items).toEqual([]);
  });

  it('stops the quote when the price list has lost the material or edge profile', () => {
    expect(quote(kitchenL({ materialId: 'gone', edgeProfileId: 'gone' })).errors).toEqual([
      'Kitchen L: its material is no longer in the price list.',
      'Kitchen L: its edge profile is no longer in the price list.',
    ]);
  });

  // leg 1 of the kitchen L: its front edge runs from 0 to 94.5" before the corner; a sink is 30" wide
  it.each([
    ['past the inside corner', sink(80), 'Kitchen L: Undermount sink 1 doesn’t fit on leg 1 at 6′ 8″.'],
    ['off the start', sink(10), 'Kitchen L: Undermount sink 1 doesn’t fit on leg 1 at 10″.'],
    ['on a leg that isn’t there', sink(40, { leg: 2 }), 'Kitchen L: Undermount sink 1 is on leg 3, which doesn’t exist.'],
  ])('stops the quote for a cutout %s', (_name, cutout, error) => {
    expect(quote(kitchenL({ cutouts: [cutout] })).errors).toEqual([error]);
  });

  it('stops the quote for a sink deeper than the counter', () => {
    // a drop-in sink is 19" front to back
    const vanity = kitchenL({ room: 'Bathroom', legs: [leg(36, 18, 0)], cutouts: [{ kind: 'dropin', leg: 0, centerline: 18, faucetHoles: 1 }] });
    expect(quote(vanity).errors).toEqual(['Bathroom: Drop-in sink 1 doesn’t fit on leg 1 at 18″.']);
  });

  it.each([
    ['1 1/2" from the corner', [sink(78)]],
    ['exactly at the start', [sink(15)]],
    // a farmhouse sink breaks through the front, so all the spare depth is at the back: 21 − 19 = 2"
    ['2" from the wall', [{ kind: 'farmhouse' as const, leg: 0, centerline: 50, faucetHoles: 0 }]],
  ])('only warns for a cutout %s', (_name, cutouts) => {
    const legs = cutouts[0].kind === 'farmhouse' ? [leg(120, 21, 0), leg(96, 21, 90)] : undefined;
    const q = quote(kitchenL({ cutouts, ...(legs && { legs }) }));
    expect(q.errors).toEqual([]);
    expect(q.warnings).toContain(`Kitchen L: ${cutouts[0].kind === 'farmhouse' ? 'Farmhouse' : 'Undermount'} sink 1 is less than 3″ from an edge or corner.`);
  });
});

describe('priceJob: warnings and slab check', () => {
  const quote = (c: Counter, p = prices) => priceJob(job({ counters: [c] }), p, 'in');

  it('warns about 2 cm in a kitchen or island, but not a bathroom', () => {
    expect(quote(kitchenL({ thickness: 2 })).warnings).toContain('Kitchen L: 2 cm is thin for a kitchen. Most shops use 3 cm here.');
    const vanity = kitchenL({ room: 'Bathroom', thickness: 2, cutouts: [], legs: [leg(36, 22, 0)] });
    expect(quote(vanity).warnings).toEqual([]);
  });

  it('warns about a depth unusual for the room', () => {
    expect(quote(kitchenL({ legs: [leg(100, 36, 0)], cutouts: [] })).warnings).toEqual(['Kitchen: Leg 1 depth 3′ 0″ is unusual for a kitchen.']);
  });

  // granite slabs are 110 × 65, quartz 120 × 56
  it('estimates slabs and seams for the kitchen L in granite', () => {
    // leg 1 (120") needs two pieces of 60"; leg 2 adds 96 − 25.5 = 70.5" past the corner.
    // pieces 70.5, 60, 60 don't pair up within 110", so 3 strips; 2 strips fit across a 65" slab
    const q = quote(kitchenL());
    expect(q.counters).toEqual([{ name: 'Kitchen L', areaSqFt: 33.734375, slabs: 2, seams: 2 }]);
    expect(q.warnings).toEqual(['Kitchen L: Leg 1 (10′ 0″) is longer than a granite slab (9′ 2″). It needs a seam.']);
  });

  it('estimates slabs and seams for the same L in quartz', () => {
    // 120" fits a 120" slab: pieces 120 and 70.5 need 2 strips, both fit across 56"
    const q = quote(kitchenL({ materialId: 'arctic' }));
    expect(q.counters).toEqual([{ name: 'Kitchen L', areaSqFt: 33.734375, slabs: 1, seams: 1 }]);
    expect(q.warnings).toEqual([]);
  });

  it('charges seams only when the price list has a seam fee', () => {
    expect(lines(job()).map(([d]) => d)).not.toContain('Seam');
    const withSeamFee = { ...prices, fees: { ...prices.fees, seam: 80 } };
    const seam = priceJob(job(), withSeamFee, 'in').items.find((x) => x.description === 'Seam');
    expect(seam).toMatchObject({ quantity: 2, rate: 80, amount: 160 });
  });
});
