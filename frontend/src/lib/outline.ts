export type Point = { x: number; y: number };
/** One leg in inches; turn is the angle inside the corner with the leg before it (ignored on the first leg). */
export type Leg = { length: number; depth: number; turn: number };

export type SideName = 'back' | 'front' | 'start' | 'end';
/** One edge of the outline, named by the leg side it belongs to (ADR 0003), never by edge number. */
/** leg counts from 0 (leg 0 is "Leg 1" in messages). */
export type Side = { leg: number; side: SideName; length: number };

const MIN_TURN = 45;
const MAX_TURN = 175;
const PRECISION = 1e9; // round results to a billionth of an inch, far below the 1/8" measurements
const MIN_FRONT = 0.01; // a front edge shorter than this means the corners used the leg up
const CROSS_TOLERANCE = 1e-6;

export type Outline = {
  /** Back (wall) corners: start of leg 1, each corner, end of the last leg. */
  back: Point[];
  /** Front corners, matching back. */
  front: Point[];
  /** Top area in square inches, from the outline so each corner is counted once. */
  area: number;
  /** Every edge: back and front of each leg, then the start of leg 1 and the end of the last leg. */
  sides: Side[];
  /** Why the shape can't be made; any error stops the quote. Bad sizes leave the outline empty. */
  errors: string[];
};

/**
 * Turns a chain of legs into the counter's outline (x right, y toward the room).
 * Each leg's length runs along its back edge into the corner (ADR 0001), so its front edge is
 * found by moving the back edge in by the depth and meeting the next leg's front edge.
 */
export function counterOutline(legs: Leg[]): Outline {
  const sizeErrors = checkSizes(legs);
  if (sizeErrors.length) return { back: [], front: [], area: 0, sides: [], errors: sizeErrors };
  let facing = 0;
  let at: Point = { x: 0, y: 0 };
  const back = [at];
  const dirs: Point[] = [];
  legs.forEach((leg, i) => {
    if (i > 0) facing += ((180 - leg.turn) * Math.PI) / 180; // always turns toward the front
    const dir = { x: Math.cos(facing), y: Math.sin(facing) };
    dirs.push(dir);
    at = { x: at.x + dir.x * leg.length, y: at.y + dir.y * leg.length };
    back.push(at);
  });
  // front edge of leg i: its back edge moved toward the room by the depth
  const toFront = (p: Point, i: number) => plus(p, inward(dirs[i]), legs[i].depth);
  const frontLine = (i: number) => ({ from: toFront(back[i], i), dir: dirs[i] });
  const n = legs.length;
  const front = [frontLine(0).from];
  for (let i = 0; i < n - 1; i++) front.push(meet(frontLine(i), frontLine(i + 1)));
  front.push(toFront(back[n], n - 1));
  // a front edge that runs backwards means the corners used the leg up
  const errors = legs.flatMap((_, i) =>
    dot(minus(front[i + 1], front[i]), dirs[i]) <= MIN_FRONT
      ? [`Leg ${i + 1} is too short for its corners. Make it longer or the depth smaller.`]
      : [],
  );
  const poly = [...back, ...[...front].reverse()];
  if (!errors.length && crossesItself(poly)) errors.push('Legs overlap. Check the lengths and turn angles.');
  const sides: Side[] = legs.flatMap((_, i): Side[] => [
    { leg: i, side: 'back', length: distance(back[i], back[i + 1]) },
    { leg: i, side: 'front', length: distance(front[i], front[i + 1]) },
  ]);
  sides.push({ leg: 0, side: 'start', length: distance(back[0], front[0]) });
  sides.push({ leg: n - 1, side: 'end', length: distance(back[n], front[n]) });
  return {
    back: back.map(tidy),
    front: front.map(tidy),
    area: shoelace(poly),
    sides: sides.map((s) => ({ ...s, length: round(s.length) })),
    errors,
  };
}

function checkSizes(legs: Leg[]): string[] {
  if (!legs.length) return ['A counter needs at least one leg.'];
  return legs.flatMap((leg, i) => {
    const errors: string[] = [];
    // isFinite also catches NaN from an unreadable measurement
    const usable = (x: number) => Number.isFinite(x) && x > 0;
    if (!usable(leg.length)) errors.push(`Leg ${i + 1} length must be more than 0.`);
    if (!usable(leg.depth)) errors.push(`Leg ${i + 1} depth must be more than 0.`);
    if (i > 0 && !(leg.turn >= MIN_TURN && leg.turn <= MAX_TURN))
      errors.push(`Leg ${i + 1} turn must be between ${MIN_TURN}° and ${MAX_TURN}°.`);
    return errors;
  });
}

/** True when two non-neighbouring edges cross; edges that only touch at a corner don't count. */
function crossesItself(poly: Point[]): boolean {
  const m = poly.length;
  const edge = (i: number) => [poly[i], poly[(i + 1) % m]];
  for (let i = 0; i < m; i++)
    for (let j = i + 2; j < m; j++) {
      if (i === 0 && j === m - 1) continue; // first and last edges share a corner
      const [a, b] = edge(i);
      const [c, d] = edge(j);
      // which way r lies from the line p→q: opposite signs on both pairs means the edges cross
      const orient = (p: Point, q: Point, r: Point) => cross(minus(q, p), minus(r, p));
      if (orient(a, b, c) * orient(a, b, d) < -CROSS_TOLERANCE && orient(c, d, a) * orient(c, d, b) < -CROSS_TOLERANCE)
        return true;
    }
  return false;
}

type Line = { from: Point; dir: Point };
const inward = (d: Point): Point => ({ x: -d.y, y: d.x });
const plus = (p: Point, d: Point, k: number): Point => ({ x: p.x + d.x * k, y: p.y + d.y * k });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
const minus = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
function meet(a: Line, b: Line): Point {
  return plus(a.from, a.dir, cross(minus(b.from, a.from), b.dir) / cross(a.dir, b.dir));
}
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
function shoelace(poly: Point[]): number {
  return Math.abs(poly.reduce((sum, p, i) => sum + cross(p, poly[(i + 1) % poly.length]), 0)) / 2;
}
// drop floating-point noise (cos 90° is 6e-17); + 0 turns -0 into 0
const round = (v: number) => Math.round(v * PRECISION) / PRECISION + 0;
const tidy = (p: Point): Point => ({ x: round(p.x), y: round(p.y) });
