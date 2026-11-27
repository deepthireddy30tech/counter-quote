import { describe, expect, it } from 'vitest';
import { newLeg, withLayout, newCounter } from './jobEditor';
import { planDrawing } from './plan';

describe('planDrawing', () => {
  it('fits a straight counter to the box and places a sink on its centreline', () => {
    const leg = { ...newLeg('Kitchen', 120), cutouts: [{ kind: 'undermount' as const, centerline: 60, faucetHoles: 1 }] };
    const plan = planDrawing([leg], 640, 420, 40);
    // 120" across 560 px is 14/3 px an inch; 25.5" deep is 119 px, centred top to bottom
    expect(plan.outline[0]).toEqual({ x: 40, y: 150.5 });
    expect(plan.cutouts[0]).toMatchObject({ center: { x: 320, y: 210 }, width: 140, angle: 0 });
    expect(plan.edges.map((e) => [e.side, e.covered])).toEqual([['back', true], ['front', false], ['start', false], ['end', false]]);
  });

  it('only offers a radius on a corner whose two edges are exposed', () => {
    const plan = planDrawing(withLayout(newCounter('Kitchen', 1, 1), 'L').legs, 640, 420, 40);
    expect(plan.corners.map((c) => [c.key, c.available])).toEqual([
      ['startBackRadius', false], ['startFrontRadius', true], ['endBackRadius', false], ['endFrontRadius', true],
    ]);
  });

  it('draws nothing when the sizes are unusable', () => {
    const plan = planDrawing([{ ...newLeg('Kitchen', NaN) }], 640, 420, 40);
    expect(plan.outline).toEqual([]);
    expect(plan.errors).toEqual(['Leg 1 length must be more than 0.']);
  });
});
