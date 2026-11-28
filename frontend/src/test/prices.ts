import type { PriceList } from '../api';

/** A small price list; the sample job prices at $1805.00 on it (see jobEditor.test.ts). */
export const prices = (): PriceList => ({
  priceGroups: [{ id: 7, name: 'Granite 2', rates: [{ thickness: 2, pricePerSqFt: 35 }, { thickness: 3, pricePerSqFt: 45 }] }],
  materials: [{ id: 3, name: 'Steel Grey', priceGroupId: 7 }],
  edgeProfiles: [{ id: 5, name: 'Eased', pricePerLinearFt: 0 }],
  fees: [
    ['undermount', 250], ['dropin', 100], ['farmhouse', 200], ['cooktop', 150], ['faucetHole', 25], ['radiusCorner', 12],
    ['backsplash', 20], ['seam', 0], ['templating', 0], ['tearOut', 400], ['minimum', 800], ['quoteValidDays', 30],
  ].map(([kind, amount], id) => ({ id, kind: kind as string, amount: amount as number })),
});
