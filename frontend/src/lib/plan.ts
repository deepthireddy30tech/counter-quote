import type { Leg as SavedLeg } from '../api';
import { counterOutline, type Point, type SideName } from './outline';
import { CUTOUTS, type CutoutKind } from './quote';

export type CornerKey = 'startFrontRadius' | 'startBackRadius' | 'endFrontRadius' | 'endBackRadius';
export type PlanEdge = { leg: number; side: SideName; a: Point; b: Point; inches: number; covered: boolean };
/** A free corner at the counter's start or end; it can only be rounded when both its edges are exposed. */
export type PlanCorner = { leg: number; key: CornerKey; at: Point; on: boolean; available: boolean };
export type PlanCutout = { kind: CutoutKind; leg: number; center: Point; width: number; depth: number; angle: number; faucetHoles: number };
/** A dimension label: text sits at `at`, outside the counter. */
export type PlanDimension = { at: Point; inches: number };
export type Plan = { outline: Point[]; edges: PlanEdge[]; corners: PlanCorner[]; cutouts: PlanCutout[]; dimensions: PlanDimension[]; errors: string[] };

/** Leg sides as the GLOSSARY names them. */
export const SIDE_NAMES: Record<SideName, string> = { back: 'back', front: 'front', start: 'start end', end: 'finish end' };

const LABEL_GAP = 16; // px between an edge and its dimension label
const HALF_LABEL = 28; // px, about half of a 13px "2′ 1 1/2″"

/** How the salesperson turned the plan: clockwise in 90° steps, mirrored first. */
export type Orientation = { rotation: number; mirrored: boolean };

/** The counter drawn to fit a width × height box in px, keeping its proportions (y runs toward the room before it's turned). */
export function planDrawing(legs: SavedLeg[], orientation: Orientation, width: number, height: number, margin: number): Plan {
  const shape = counterOutline(legs.map((l) => ({ length: l.length, depth: l.depth, turn: l.turnAngle })));
  const empty = { outline: [], edges: [], corners: [], cutouts: [], dimensions: [], errors: shape.errors };
  if (!shape.back.length) return empty;
  const turn = turned(orientation);
  // a mirror image swaps which side of an edge is the room, so labels must go the other way
  const hand = orientation.mirrored ? -1 : 1;
  const all = [...shape.back, ...shape.front].map(turn);
  const minX = Math.min(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const spanX = Math.max(...all.map((p) => p.x)) - minX;
  const spanY = Math.max(...all.map((p) => p.y)) - minY;
  const scale = Math.min((width - 2 * margin) / spanX, (height - 2 * margin) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  const px = (inches: Point): Point => {
    const p = turn(inches);
    return { x: offX + (p.x - minX) * scale, y: offY + (p.y - minY) * scale };
  };
  const back = shape.back.map(px);
  const front = shape.front.map(px);
  const n = legs.length;

  const ends: Record<SideName, (i: number) => [Point, Point]> = {
    back: (i) => [back[i], back[i + 1]],
    front: (i) => [front[i], front[i + 1]],
    start: () => [back[0], front[0]],
    end: () => [back[n], front[n]],
  };
  const edges = shape.sides.map(({ leg, side, length }) => {
    const [a, b] = ends[side](leg);
    return { leg, side, a, b, inches: length, covered: legs[leg][`${side}Covered`] };
  });

  const corner = (leg: number, key: CornerKey, at: Point): PlanCorner => ({ leg, key, at, on: legs[leg][key], available: canRadius(legs[leg], key) });
  const corners = [
    corner(0, 'startBackRadius', back[0]),
    corner(0, 'startFrontRadius', front[0]),
    corner(n - 1, 'endBackRadius', back[n]),
    corner(n - 1, 'endFrontRadius', front[n]),
  ];

  const cutouts = legs.flatMap((l, i) => {
    const dir = unit(shape.back[i], shape.back[i + 1]);
    const toRoom = { x: -dir.y, y: dir.x };
    return l.cutouts.map((c) => {
      const spec = CUTOUTS[c.kind];
      // a farmhouse sink sits at the front edge; the rest are centred front to back
      const inFrom = c.kind === 'farmhouse' ? l.depth - spec.depth / 2 : l.depth / 2;
      const center = px({
        x: shape.back[i].x + dir.x * c.centerline + toRoom.x * inFrom,
        y: shape.back[i].y + dir.y * c.centerline + toRoom.y * inFrom,
      });
      const along = unit(px(shape.back[i]), px(shape.back[i + 1]));
      return { kind: c.kind, leg: i, center, width: spec.width * scale, depth: spec.depth * scale, angle: (Math.atan2(along.y, along.x) * 180) / Math.PI, faucetHoles: c.faucetHoles };
    });
  });

  const outside = (a: Point, b: Point, away: Point): Point => {
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    // centred text sticks out sideways by half its width, so a label beside an upright edge goes further out
    const gap = LABEL_GAP + Math.abs(away.x) * HALF_LABEL;
    return { x: mid.x + away.x * gap, y: mid.y + away.y * gap };
  };
  const dimensions = legs.map((l, i) => {
    const d = unit(back[i], back[i + 1]);
    return { at: outside(back[i], back[i + 1], { x: hand * d.y, y: -hand * d.x }), inches: l.length };
  });
  const d0 = unit(back[0], back[1]);
  dimensions.push({ at: outside(back[0], front[0], { x: -d0.x, y: -d0.y }), inches: legs[0].depth });

  return { outline: [...back, ...[...front].reverse()], edges, corners, cutouts, dimensions, errors: shape.errors };
}

/** A corner can only be a radius corner when both edges that meet there are exposed. */
export function canRadius(leg: SavedLeg, key: CornerKey): boolean {
  const end = key.startsWith('start') ? 'start' : 'end';
  const side = key.includes('Front') ? 'front' : 'back';
  return !leg[`${end}Covered`] && !leg[`${side}Covered`];
}

function turned({ rotation, mirrored }: Orientation): (p: Point) => Point {
  const r = (rotation * Math.PI) / 180;
  const [cos, sin] = [Math.round(Math.cos(r)), Math.round(Math.sin(r))]; // exact for 90° steps
  return (p) => {
    const x = mirrored ? -p.x : p.x;
    return { x: x * cos - p.y * sin, y: x * sin + p.y * cos };
  };
}

function unit(a: Point, b: Point): Point {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
}

/** A small cross-section of the edge profile, 60 wide with the polished edge on the right. */
// shortcut: picks the drawing from words in the profile's name, so a renamed profile draws as eased; store a shape per profile if shops rename them
export function profilePath(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('bevel')) return 'M0 0 H54 L60 6 V20 H0 Z';
  if (n.includes('full bullnose')) return 'M0 0 H50 A10 10 0 0 1 50 20 H0 Z';
  if (n.includes('bullnose')) return 'M0 0 H50 A10 10 0 0 1 60 10 V20 H0 Z';
  if (n.includes('ogee')) return 'M0 0 H46 C54 0 52 10 60 10 V20 H0 Z';
  if (n.includes('miter')) return 'M0 0 H60 V34 H54 V6 H0 Z';
  return 'M0 0 H57 Q60 0 60 3 V17 Q60 20 57 20 H0 Z'; // eased
}
