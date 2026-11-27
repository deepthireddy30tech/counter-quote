import { describe, expect, it } from 'vitest';
import { counterOutline } from './outline';

describe('counterOutline: outline points', () => {
  it('draws a straight counter with its back along the wall', () => {
    const o = counterOutline([{ length: 120, depth: 25.5, turn: 0 }]);
    expect(o.errors).toEqual([]);
    expect(o.back).toEqual([{ x: 0, y: 0 }, { x: 120, y: 0 }]);
    expect(o.front).toEqual([{ x: 0, y: 25.5 }, { x: 120, y: 25.5 }]);
  });

  // back wall along the top, then down the right-hand wall; front corner meets inside the L
  it('turns a square corner for an L, legs overlapping at the corner', () => {
    const o = counterOutline([
      { length: 120, depth: 25, turn: 0 },
      { length: 96, depth: 25, turn: 90 },
    ]);
    expect(o.back).toEqual([{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 120, y: 96 }]);
    expect(o.front).toEqual([{ x: 0, y: 25 }, { x: 95, y: 25 }, { x: 95, y: 96 }]);
  });

  it('turns 45° at a 135° corner, meeting the front edges on the mitre', () => {
    const o = counterOutline([
      { length: 100, depth: 20, turn: 0 },
      { length: 100, depth: 20, turn: 135 },
    ]);
    const r = Math.SQRT1_2; // cos 45°
    // front corner sits 20 × tan(22.5°) = 8.284" back from the back corner along leg 1
    expect(o.front[1].x).toBeCloseTo(91.716, 3);
    expect(o.front[1].y).toBeCloseTo(20, 9);
    expect(o.back[2].x).toBeCloseTo(100 + 100 * r, 9);
    expect(o.back[2].y).toBeCloseTo(100 * r, 9);
  });
});

// equal depths: depth × total back length, less depth² × tan(half the change of direction) per corner
describe('counterOutline: area', () => {
  it.each([
    ['straight 120 × 25 1/2', [{ length: 120, depth: 25.5, turn: 0 }], 3060],
    ['L 120 + 96, 25 deep', [{ length: 120, depth: 25, turn: 0 }, { length: 96, depth: 25, turn: 90 }], 4775],
    [
      'U 96 + 120 + 96, 25 deep',
      [{ length: 96, depth: 25, turn: 0 }, { length: 120, depth: 25, turn: 90 }, { length: 96, depth: 25, turn: 90 }],
      6550,
    ],
    ['135° corner, 100 + 100, 20 deep', [{ length: 100, depth: 20, turn: 0 }, { length: 100, depth: 20, turn: 135 }], 3834.3146],
    // 120 × 25 along the wall, plus the 36-deep leg below it: 36 × (60 − 25)
    ['legs of different depths', [{ length: 120, depth: 25, turn: 0 }, { length: 60, depth: 36, turn: 90 }], 4260],
  ])('%s', (_name, legs, area) => {
    expect(counterOutline(legs).area).toBeCloseTo(area, 3);
  });
});

describe('counterOutline: edge lengths per leg side', () => {
  it('gives each leg its back and front, and the chain its start and end', () => {
    const o = counterOutline([
      { length: 120, depth: 25, turn: 0 },
      { length: 96, depth: 25, turn: 90 },
    ]);
    expect(o.sides).toEqual([
      { leg: 0, side: 'back', length: 120 },
      { leg: 0, side: 'front', length: 95 },
      { leg: 1, side: 'back', length: 96 },
      { leg: 1, side: 'front', length: 71 },
      { leg: 0, side: 'start', length: 25 },
      { leg: 1, side: 'end', length: 25 },
    ]);
  });

  it('measures a front edge to the mitre at an angled corner', () => {
    const o = counterOutline([
      { length: 100, depth: 20, turn: 0 },
      { length: 100, depth: 20, turn: 135 },
    ]);
    const front = o.sides.filter((s) => s.side === 'front').map((s) => s.length);
    expect(front[0]).toBeCloseTo(91.716, 3);
    expect(front[1]).toBeCloseTo(91.716, 3);
  });

  // the deeper leg's front line meets leg 1's front 7.716" before leg 2's back starts, so its front
  // edge is longer than its back: 100 + (36 × sin 45° − 20) / sin 45°
  it("lengthens the deeper leg's front edge at an angled corner with mixed depths", () => {
    const o = counterOutline([
      { length: 100, depth: 20, turn: 0 },
      { length: 100, depth: 36, turn: 135 },
    ]);
    const front = o.sides.filter((s) => s.side === 'front').map((s) => s.length);
    expect(front[0]).toBeCloseTo(69.088, 3);
    expect(front[1]).toBeCloseTo(107.716, 3);
  });
});

describe('counterOutline: impossible shapes', () => {
  const leg = (length: number, depth = 25, turn = 90) => ({ length, depth, turn });

  it.each([
    ['no legs', [], 'A counter needs at least one leg.'],
    ['a zero length', [leg(0)], 'Leg 1 length must be more than 0.'],
    ['a negative depth', [leg(120, -1)], 'Leg 1 depth must be more than 0.'],
    ['an unreadable depth', [leg(120, NaN)], 'Leg 1 depth must be more than 0.'],
    ['an endless length', [leg(Infinity)], 'Leg 1 length must be more than 0.'],
    ['a turn under 45°', [leg(120), leg(96, 25, 30)], 'Leg 2 turn must be between 45° and 175°.'],
    ['a turn over 175°', [leg(120), leg(96, 25, 180)], 'Leg 2 turn must be between 45° and 175°.'],
    ['a leg shorter than the depth it joins', [leg(120), leg(20)], 'Leg 2 is too short for its corners. Make it longer or the depth smaller.'],
    // a fourth leg running back across the first
    ['legs that overlap', [leg(100, 10), leg(100, 10), leg(100, 10), leg(120, 10)], 'Legs overlap. Check the lengths and turn angles.'],
  ])('stops the quote for %s', (_name, legs, error) => {
    expect(counterOutline(legs).errors).toContain(error);
  });

  it('reports every bad size at once', () => {
    expect(counterOutline([leg(0, 0), leg(96, 25, 10)]).errors).toEqual([
      'Leg 1 length must be more than 0.',
      'Leg 1 depth must be more than 0.',
      'Leg 2 turn must be between 45° and 175°.',
    ]);
  });

  it.each([45, 175])('accepts a turn of exactly %d°', (turn) => {
    expect(counterOutline([leg(120), leg(96, 25, turn)]).errors).toEqual([]);
  });

  it('ignores the turn on the first leg', () => {
    expect(counterOutline([leg(120, 25, 0)]).errors).toEqual([]);
  });

  it('accepts a closed-in U whose legs only touch the wall corners', () => {
    expect(counterOutline([leg(96), leg(120), leg(96)]).errors).toEqual([]);
  });
});
