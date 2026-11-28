import { counterOutline, type Leg, type Outline, type Point, type SideName } from './outline';
import { formatMeasurement, type Unit } from './measure';

export type Room = 'Kitchen' | 'Island' | 'Bathroom' | 'Other';
export type Thickness = 2 | 3;
export type CutoutKind = 'undermount' | 'dropin' | 'farmhouse' | 'cooktop';

/** A leg with its edge and corner choices (ADR 0003). Start and end choices only apply to the first and last leg. */
export type CounterLeg = Leg & {
  backCovered: boolean;
  frontCovered: boolean;
  startCovered: boolean;
  endCovered: boolean;
  startFrontRadius: boolean;
  startBackRadius: boolean;
  endFrontRadius: boolean;
  endBackRadius: boolean;
};
/** leg counts from 0; centerline is inches from the leg's start along its back edge. */
export type Cutout = { kind: CutoutKind; leg: number; centerline: number; faucetHoles: number };
export type Counter = {
  room: Room;
  materialId: string;
  thickness: Thickness;
  edgeProfileId: string;
  backsplash: boolean;
  legs: CounterLeg[];
  cutouts: Cutout[];
};
export type AdditionalRequirement = { description: string; price: number };
export type Job = { counters: Counter[]; tearOut: boolean; additionalRequirements: AdditionalRequirement[] };

export type FeeKind =
  | CutoutKind
  | 'faucetHole'
  | 'radiusCorner'
  | 'backsplash'
  | 'seam'
  | 'templating'
  | 'tearOut'
  | 'minimum';
export type PriceList = {
  priceGroups: { id: string; name: string; pricePerSqFt: Record<Thickness, number> }[];
  materials: { id: string; name: string; priceGroupId: string }[];
  edgeProfiles: { id: string; name: string; pricePerLinearFt: number }[];
  fees: Record<FeeKind, number>;
};

/** counter is the counter's name, or 'Job' for job-wide lines. */
export type LineItem = { counter: string; description: string; quantity: number; unit: string; rate: number; amount: number };
/** The slab estimate is a check for the salesperson; it doesn't change the price. */
export type CounterSummary = { name: string; areaSqFt: number; slabEstimate: number; seams: number };
/** Any error stops the quote: no items and no total. Warnings only flag. */
export type Quote = { items: LineItem[]; total: number | null; counters: CounterSummary[]; errors: string[]; warnings: string[] };

/** Width along the leg and depth front to back, in inches. */
export const CUTOUTS: Record<CutoutKind, { name: string; width: number; depth: number }> = {
  undermount: { name: 'Undermount sink', width: 30, depth: 16 },
  dropin: { name: 'Drop-in sink', width: 33, depth: 19 },
  farmhouse: { name: 'Farmhouse sink', width: 33, depth: 19 },
  cooktop: { name: 'Cooktop', width: 30, depth: 20 },
};
const CUTOUT_CLEARANCE = 3; // inches to an edge, corner or seam (docs/research/pricing.md §11)
// shortcut: two slab sizes picked by the price group's name; move them to the price list if shops need others
const SLAB = { quartz: { length: 120, width: 56 }, stone: { length: 110, width: 65 } };

/** Usual depth range per room, in inches; outside it only warns. */
const USUAL_DEPTH: Record<Room, [number, number] | null> = {
  Kitchen: [24, 30],
  Island: [24, 48],
  Bathroom: [18, 25],
  Other: null,
};

type CounterPrice = { items: LineItem[]; errors: string[]; warnings: string[]; areaSqFt: number; slabEstimate: number; seams: number };

/** Prices a whole job from the shop's price list. */
export function priceJob(job: Job, prices: PriceList, unit: Unit): Quote {
  const names = counterNames(job.counters);
  const counters = job.counters.map((c) => priceCounter(c, prices, unit));
  const named = (i: number) => (message: string) => `${names[i]}: ${message}`;
  const errors = counters.flatMap((c, i) => c.errors.map(named(i)));
  const warnings = counters.flatMap((c, i) => c.warnings.map(named(i)));
  const summaries = counters.map((c, i) => ({ name: names[i], areaSqFt: c.areaSqFt, slabEstimate: c.slabEstimate, seams: c.seams }));
  if (errors.length) return { items: [], total: null, counters: summaries, errors, warnings };
  const items = counters.flatMap((c, i) => c.items.map((x) => ({ ...x, counter: names[i] })));
  const fees = prices.fees;
  const add = (description: string, amount: number) =>
    items.push({ counter: 'Job', description, quantity: 1, unit: 'job', rate: cents(amount), amount: cents(amount) });
  if (fees.templating > 0) add('Templating visit', fees.templating);
  if (job.tearOut) add('Tear-out of old counters', fees.tearOut);
  for (const r of job.additionalRequirements) if (r.description.trim()) add(r.description.trim(), Math.max(0, r.price));
  const sum = cents(items.reduce((s, x) => s + x.amount, 0));
  if (sum < fees.minimum) add('Minimum job charge', fees.minimum - sum);
  return { items, total: Math.max(sum, cents(fees.minimum)), counters: summaries, errors, warnings };
}

function priceCounter(counter: Counter, prices: PriceList, unit: Unit): CounterPrice {
  const outline = counterOutline(counter.legs);
  const material = prices.materials.find((m) => m.id === counter.materialId);
  const group = prices.priceGroups.find((g) => g.id === material?.priceGroupId);
  const profile = prices.edgeProfiles.find((e) => e.id === counter.edgeProfileId);
  const errors = [...outline.errors];
  if (!material || !group) errors.push('its material is no longer in the price list.');
  if (!profile) errors.push('its edge profile is no longer in the price list.');
  const none = { items: [], warnings: [], areaSqFt: 0, slabEstimate: 0, seams: 0 };
  if (errors.length || !material || !group || !profile) return { ...none, errors };
  const fit = checkCutouts(counter, outline, unit);
  if (fit.errors.length) return { ...none, errors: fit.errors };
  const slab = slabCheck(counter, group.name, unit);
  const warnings = [...fit.warnings, ...slab.warnings, ...otherWarnings(counter, unit)];

  const items: LineItem[] = [];
  const add = (description: string, quantity: number, per: string, rate: number) => {
    if (quantity > 0) items.push({ counter: '', description, quantity, unit: per, rate, amount: cents(quantity * rate) });
  };
  const isCovered = (leg: number, side: SideName) => counter.legs[leg][`${side}Covered`];
  const feet = (covered: boolean) =>
    cents(outline.sides.filter((s) => isCovered(s.leg, s.side) === covered).reduce((sum, s) => sum + s.length, 0) / 12);
  const fees = prices.fees;

  add(`${material.name}, ${counter.thickness} cm`, roundUp(outline.area / 144), 'sq ft', group.pricePerSqFt[counter.thickness]);
  add(`${profile.name} edge`, feet(false), 'lf', profile.pricePerLinearFt);
  for (const kind of Object.keys(CUTOUTS) as CutoutKind[])
    add(`${CUTOUTS[kind].name} cutout`, counter.cutouts.filter((c) => c.kind === kind).length, 'each', fees[kind]);
  add('Faucet hole', counter.cutouts.reduce((sum, c) => sum + (c.kind === 'cooktop' ? 0 : c.faucetHoles), 0), 'each', fees.faucetHole);
  add('Radius corner', radiusCorners(counter.legs), 'each', fees.radiusCorner);
  if (counter.backsplash) add('4″ backsplash', feet(true), 'lf', fees.backsplash);
  if (fees.seam > 0) add('Seam', slab.seams, 'each', fees.seam);
  return { items, errors: [], warnings, areaSqFt: outline.area / 144, slabEstimate: slab.slabEstimate, seams: slab.seams };
}

function otherWarnings(counter: Counter, unit: Unit): string[] {
  const room = counter.room.toLowerCase();
  const warnings: string[] = [];
  if (counter.thickness === 2 && (counter.room === 'Kitchen' || counter.room === 'Island'))
    warnings.push(`2 cm is thin for a ${room}. Most shops use 3 cm here.`);
  const usual = USUAL_DEPTH[counter.room];
  counter.legs.forEach((l, i) => {
    if (usual && (l.depth < usual[0] || l.depth > usual[1]))
      warnings.push(`Leg ${i + 1} depth ${formatMeasurement(l.depth, unit)} is unusual for a ${room}.`);
  });
  return warnings;
}

/**
 * Seams: one at each corner, plus more wherever a leg is longer than a slab.
 * Slabs: the pieces packed end to end into slab-length strips, as many strips across a slab as its width allows.
 */
function slabCheck(counter: Counter, groupName: string, unit: Unit) {
  const slab = /quartz/i.test(groupName) ? SLAB.quartz : SLAB.stone;
  const warnings: string[] = [];
  const pieces: number[] = [];
  let seams = counter.legs.length - 1;
  counter.legs.forEach((l, i) => {
    const pastCorner = l.length - (i > 0 ? counter.legs[i - 1].depth : 0); // the corner square belongs to the leg before
    const parts = Math.max(1, roundUp(pastCorner / slab.length));
    if (parts > 1)
      warnings.push(
        `Leg ${i + 1} (${formatMeasurement(l.length, unit)}) is longer than a slab (${formatMeasurement(slab.length, unit)}). It needs a seam.`,
      );
    seams += parts - 1;
    for (let p = 0; p < parts; p++) pieces.push(pastCorner / parts);
  });
  const strips: number[] = [];
  for (const piece of pieces.sort((a, b) => b - a)) {
    const fits = strips.findIndex((s) => s + piece <= slab.length);
    if (fits >= 0) strips[fits] += piece;
    else strips.push(piece);
  }
  const perSlab = Math.max(1, Math.floor(slab.width / Math.max(...counter.legs.map((l) => l.depth))));
  return { seams, slabEstimate: Math.ceil(strips.length / perSlab), warnings };
}

/** Each cutout must sit on the front edge's straight part of its leg, and fit front to back. */
function checkCutouts(counter: Counter, outline: Outline, unit: Unit): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  counter.cutouts.forEach((c, i) => {
    const spec = CUTOUTS[c.kind];
    const label = `${spec.name} ${i + 1}`;
    const leg = counter.legs[c.leg];
    if (!leg) return errors.push(`${label} is on leg ${c.leg + 1}, which doesn’t exist.`);
    // where the front edge starts and ends, measured along the leg from its back start
    const start = outline.back[c.leg];
    const along = (p: Point) =>
      ((p.x - start.x) * (outline.back[c.leg + 1].x - start.x) + (p.y - start.y) * (outline.back[c.leg + 1].y - start.y)) / leg.length;
    const before = c.centerline - spec.width / 2 - Math.max(along(outline.front[c.leg]), 0);
    const after = Math.min(along(outline.front[c.leg + 1]), leg.length) - (c.centerline + spec.width / 2);
    // a farmhouse sink breaks through the front edge, so its spare depth is all at the back
    const spare = c.kind === 'farmhouse' ? leg.depth - spec.depth : (leg.depth - spec.depth) / 2;
    if (before < 0 || after < 0 || spare <= 0)
      return errors.push(`${label} doesn’t fit on leg ${c.leg + 1} at ${formatMeasurement(c.centerline, unit)}.`);
    if (Math.min(before, after, spare) < CUTOUT_CLEARANCE)
      warnings.push(`${label} is less than ${formatMeasurement(CUTOUT_CLEARANCE, unit)} from an edge or corner.`);
  });
  // two cutouts on one leg can't share stone
  counter.cutouts.forEach((a, i) =>
    counter.cutouts.slice(i + 1).forEach((b, k) => {
      const reach = (CUTOUTS[a.kind].width + CUTOUTS[b.kind].width) / 2;
      if (a.leg === b.leg && Math.abs(a.centerline - b.centerline) < reach)
        errors.push(`${CUTOUTS[a.kind].name} ${i + 1} and ${CUTOUTS[b.kind].name} ${i + k + 2} overlap.`);
    }),
  );
  return { errors, warnings };
}

/** Counts the radius corners asked for, skipping any where either edge is covered (they can't be rounded). */
function radiusCorners(legs: CounterLeg[]): number {
  const first = legs[0];
  const last = legs[legs.length - 1];
  return [
    first.startFrontRadius && !first.startCovered && !first.frontCovered,
    first.startBackRadius && !first.startCovered && !first.backCovered,
    last.endFrontRadius && !last.endCovered && !last.frontCovered,
    last.endBackRadius && !last.endCovered && !last.backCovered,
  ].filter(Boolean).length;
}

/** Kitchen, Kitchen L, Kitchen U or Kitchen (4 legs); a repeated name gets a number. */
function counterNames(counters: Counter[]): string[] {
  const seen: Record<string, number> = {};
  return counters.map((c) => {
    const angled = c.legs.some((l, i) => i > 0 && l.turn !== 90);
    const n = c.legs.length;
    const base = n === 1 ? c.room : !angled && n === 2 ? `${c.room} L` : !angled && n === 3 ? `${c.room} U` : `${c.room} (${n} legs)`;
    seen[base] = (seen[base] ?? 0) + 1;
    return seen[base] > 1 ? `${base} ${seen[base]}` : base;
  });
}

const cents = (v: number) => Math.round(v * 100) / 100;
const roundUp = (v: number) => Math.ceil(v - 1e-9); // ignore float noise like 34.0000000001
