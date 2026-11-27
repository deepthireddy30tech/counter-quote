import type { PriceList } from '../api';

/** What each fee kind is called on the Price list page, in the order shown there. */
export const FEE_LABELS: Record<string, string> = {
  undermount: 'Undermount sink cutout',
  dropin: 'Drop-in sink cutout',
  farmhouse: 'Farmhouse sink cutout',
  cooktop: 'Cooktop cutout',
  faucetHole: 'Faucet hole',
  radiusCorner: 'Radius corner',
  backsplash: 'Backsplash, per linear ft',
  seam: 'Seam',
  templating: 'Templating visit (0 = included in the rate)',
  tearOut: 'Tear-out of old counters',
  minimum: 'Minimum job charge',
  quoteValidDays: 'Quote valid for (days)',
};

const key = (name: string) => name.trim().toLowerCase();
const price = (n: number) => Number.isFinite(n) && n >= 0;

/** Why the price list can't be saved yet, in words for the shop owner. Empty when it can. */
export function priceListProblems(list: PriceList): string[] {
  const problems: string[] = [];
  const named = (rows: { name: string }[], what: string, plural: string) => {
    if (rows.some((r) => !r.name.trim())) problems.push(`Every ${what} needs a name.`);
    const seen = new Set<string>();
    for (const r of rows.filter((r) => r.name.trim())) {
      if (seen.has(key(r.name))) problems.push(`Two ${plural} are called ${rows.find((x) => key(x.name) === key(r.name))!.name.trim()}.`);
      seen.add(key(r.name));
    }
  };
  named(list.priceGroups, 'price group', 'price groups');
  named(list.materials, 'material', 'materials');
  named(list.edgeProfiles, 'edge profile', 'edge profiles');

  for (const g of list.priceGroups)
    for (const r of g.rates) if (!price(r.pricePerSqFt)) problems.push(`${g.name} needs a ${r.thickness} cm price of $0 or more.`);
  for (const m of list.materials) if (!list.priceGroups.some((g) => g.id !== 0 && g.id === m.priceGroupId)) problems.push(`${m.name} needs a price group.`);
  for (const e of list.edgeProfiles) if (!price(e.pricePerLinearFt)) problems.push(`${e.name} needs a price of $0 or more.`);
  for (const f of list.fees) {
    if (f.kind === 'quoteValidDays') {
      if (!Number.isInteger(f.amount) || f.amount < 1) problems.push('Quotes must stay valid for a whole number of days, at least 1.');
    } else if (!price(f.amount)) problems.push(`${FEE_LABELS[f.kind] ?? f.kind} needs an amount of $0 or more.`);
  }
  return problems;
}
