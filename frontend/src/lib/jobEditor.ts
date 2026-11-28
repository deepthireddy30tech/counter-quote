import type { Counter as SavedCounter, Job as SavedJob, Leg as SavedLeg, PriceList as SavedPriceList } from '../api';
import type { Counter, FeeKind, Job, PriceList, Quote, Room } from './quote';

export const ROOMS: Room[] = ['Kitchen', 'Island', 'Bathroom', 'Other'];
/** The layouts a counter can be set to, by number of legs. Angled corners or more legs make it Custom. */
export const LAYOUTS = { Straight: { legs: 1, name: 'Straight' }, L: { legs: 2, name: 'L-shape' }, U: { legs: 3, name: 'U-shape' } } as const;
export type Layout = keyof typeof LAYOUTS;
const NEW_LEG_LENGTH = 96;

/** A room's starting depth and covered edges; an island starts with every edge exposed. */
const ROOM_DEFAULTS: Record<Room, { depth: number; backCovered: boolean }> = {
  Kitchen: { depth: 25.5, backCovered: true },
  Island: { depth: 36, backCovered: false },
  Bathroom: { depth: 22, backCovered: true },
  Other: { depth: 25.5, backCovered: true },
};

/** The saved job (cutouts nested in legs, numeric ids) as the quote calculation reads it. */
export function toQuoteJob(job: SavedJob): Job {
  return {
    tearOut: job.tearOut,
    additionalRequirements: job.additionalRequirements.map((r) => ({ ...r, price: r.price || 0 })), // a blank price is $0
    counters: job.counters.map(toQuoteCounter),
  };
}

function toQuoteCounter(c: SavedCounter): Counter {
  return {
    room: c.room,
    materialId: String(c.materialId),
    thickness: c.thickness,
    edgeProfileId: String(c.edgeProfileId),
    backsplash: c.backsplash,
    legs: c.legs.map(({ cutouts: _, turnAngle, ...leg }) => ({ ...leg, turn: turnAngle })),
    cutouts: c.legs.flatMap((l, leg) => l.cutouts.map((x) => ({ ...x, leg }))),
  };
}

/** The stored price list as the quote calculation reads it. */
export function toQuotePrices(list: SavedPriceList): PriceList {
  return {
    priceGroups: list.priceGroups.map((g) => ({
      id: String(g.id),
      name: g.name,
      pricePerSqFt: {
        2: g.rates.find((r) => r.thickness === 2)?.pricePerSqFt ?? NaN,
        3: g.rates.find((r) => r.thickness === 3)?.pricePerSqFt ?? NaN,
      },
    })),
    materials: list.materials.map((m) => ({ id: String(m.id), name: m.name, priceGroupId: String(m.priceGroupId) })),
    edgeProfiles: list.edgeProfiles.map((e) => ({ ...e, id: String(e.id) })),
    fees: Object.fromEntries(list.fees.map((f) => [f.kind, f.amount])) as Record<FeeKind, number>,
  };
}

export function newLeg(room: Room, length: number, depth = ROOM_DEFAULTS[room].depth): SavedLeg {
  return {
    length, depth, turnAngle: 90,
    backCovered: ROOM_DEFAULTS[room].backCovered, frontCovered: false, startCovered: false, endCovered: false,
    startFrontRadius: false, startBackRadius: false, endFrontRadius: false, endBackRadius: false,
    cutouts: [],
  };
}

export function newCounter(room: Room, materialId: number, edgeProfileId: number): SavedCounter {
  return { room, materialId, thickness: 3, edgeProfileId, backsplash: false, legs: [newLeg(room, NEW_LEG_LENGTH)] };
}

/** What a new job opens with: a Kitchen L against two walls, with an undermount sink. */
export function sampleJob(materialId: number, edgeProfileId: number): SavedJob {
  const counter = withLayout(newCounter('Kitchen', materialId, edgeProfileId), 'L');
  counter.legs[0] = { ...counter.legs[0], length: 120, startCovered: true, cutouts: [{ kind: 'undermount', centerline: 60, faucetHoles: 1 }] };
  return {
    id: 0, customerName: '', tearOut: false, createdDate: new Date().toISOString(), // the server sets its own on create
    counters: [counter], additionalRequirements: [],
    total: null, savedAt: null, validUntil: null, quoteDrawingSvg: null, lineItems: [],
  };
}

/** Straight, L or U when the legs match one (square corners); anything else is Custom. */
export function layoutOf(counter: SavedCounter): Layout | 'Custom' {
  const square = counter.legs.every((l, i) => i === 0 || l.turnAngle === 90);
  const match = (Object.keys(LAYOUTS) as Layout[]).find((k) => LAYOUTS[k].legs === counter.legs.length);
  return square && match ? match : 'Custom';
}

/** Keeps the first legs, squares their corners, and adds legs as deep as the last one. */
export function withLayout(counter: SavedCounter, layout: Layout): SavedCounter {
  let next = { ...counter, legs: counter.legs.slice(0, LAYOUTS[layout].legs).map((l, i) => (i === 0 ? l : { ...l, turnAngle: 90 })) };
  while (next.legs.length < LAYOUTS[layout].legs) next = withLegAdded(next);
  return next;
}

/** A new square leg on the end, as deep as the last one. */
export function withLegAdded(counter: SavedCounter): SavedCounter {
  return { ...counter, legs: [...counter.legs, newLeg(counter.room, NEW_LEG_LENGTH, counter.legs[counter.legs.length - 1].depth)] };
}

/** A new room resets every leg's depth and covered edges to that room's starting values. */
export function withRoom(counter: SavedCounter, room: Room): SavedCounter {
  const { depth, backCovered } = ROOM_DEFAULTS[room];
  return {
    ...counter,
    room,
    legs: counter.legs.map((l) => ({ ...l, depth, backCovered, frontCovered: false, startCovered: false, endCovered: false })),
  };
}

/**
 * The job with today's quote attached, ready to save (ADR 0002). A job that can't be priced saves with no quote.
 * A null quote keeps the job's saved quote and its valid-until date, for a job saved without re-pricing.
 */
export function withSavedQuote(job: SavedJob, quote: Quote | null, validDays: number, now: Date): SavedJob {
  const tidied = {
    ...job,
    customerName: job.customerName.trim(),
    // a requirement with no description isn't quoted, so it isn't kept
    additionalRequirements: job.additionalRequirements
      .filter((r) => r.description.trim())
      .map((r) => ({ description: r.description.trim(), price: r.price || 0 })),
  };
  if (!quote) return tidied;
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + validDays);
  return {
    ...tidied,
    lineItems: quote.items,
    total: quote.total,
    savedAt: quote.total == null ? null : now.toISOString(),
    validUntil: quote.total == null ? null : validUntil.toISOString(),
  };
}

export const quoteValidDays = (list: SavedPriceList) => list.fees.find((f) => f.kind === 'quoteValidDays')?.amount ?? 30;
