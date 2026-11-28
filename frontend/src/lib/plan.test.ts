import { describe, expect, it } from 'vitest';
import { newLeg, withLayout, newCounter } from './jobEditor';
import { planDrawing } from './plan';

const UPRIGHT = { rotation: 0, mirrored: false };

describe('planDrawing', () => {
  it('fits a straight counter to the box and places a sink on its centreline', () => {
    const leg = { ...newLeg('Kitchen', 120), cutouts: [{ kind: 'undermount' as const, centerline: 60, faucetHoles: 1 }] };
    const plan = planDrawing([leg], UPRIGHT, 640, 420, 40);
    // 120" across 560 px is 14/3 px an inch; 25.5" deep is 119 px, centred top to bottom
    expect(plan.outline[0]).toEqual({ x: 40, y: 150.5 });
    expect(plan.cutouts[0]).toMatchObject({ center: { x: 320, y: 210 }, width: 140, angle: 0 });
    expect(plan.edges.map((e) => [e.side, e.covered])).toEqual([['back', true], ['front', false], ['start', false], ['end', false]]);
  });

  it('only offers a radius on a corner whose two edges are exposed', () => {
    const plan = planDrawing(withLayout(newCounter('Kitchen', 1, 1), 'L').legs, UPRIGHT, 640, 420, 40);
    expect(plan.corners.map((c) => [c.key, c.available])).toEqual([
      ['startBackRadius', false], ['startFrontRadius', true], ['endBackRadius', false], ['endFrontRadius', true],
    ]);
  });

  it('turns the plan clockwise, keeping sizes on the wall side and sinks in line with their leg', () => {
    const leg = { ...newLeg('Kitchen', 120), cutouts: [{ kind: 'undermount' as const, centerline: 60, faucetHoles: 1 }] };
    const plan = planDrawing([leg], { rotation: 90, mirrored: false }, 640, 420, 40);
    const back = plan.edges.find((e) => e.side === 'back')!;
    const front = plan.edges.find((e) => e.side === 'front')!;
    expect(back.a.x).toBeCloseTo(back.b.x); // the wall now runs top to bottom
    expect(back.b.y).toBeGreaterThan(back.a.y);
    expect(front.a.x).toBeLessThan(back.a.x); // the room is to the left of the wall
    expect(plan.dimensions[0].at.x).toBeGreaterThan(back.a.x); // the length label sits behind the wall
    expect(plan.cutouts[0].angle).toBeCloseTo(90);
  });

  it('mirrors an L so it turns the other way, sizes still behind the wall', () => {
    const legs = withLayout(newCounter('Kitchen', 1, 1), 'L').legs;
    const plain = planDrawing(legs, UPRIGHT, 640, 420, 40);
    const mirrored = planDrawing(legs, { rotation: 0, mirrored: true }, 640, 420, 40);
    const firstBack = (p: typeof plain) => p.edges.find((e) => e.leg === 0 && e.side === 'back')!;
    expect(firstBack(plain).b.x).toBeGreaterThan(firstBack(plain).a.x);
    expect(firstBack(mirrored).b.x).toBeLessThan(firstBack(mirrored).a.x); // leg 1 now runs right to left
    expect(mirrored.dimensions[0].at.y).toBeLessThan(firstBack(mirrored).a.y); // its length label stays above the wall
  });

  it('draws nothing when the sizes are unusable', () => {
    const plan = planDrawing([{ ...newLeg('Kitchen', NaN) }], UPRIGHT, 640, 420, 40);
    expect(plan.outline).toEqual([]);
    expect(plan.errors).toEqual(['Leg 1 length must be more than 0.']);
  });
});
