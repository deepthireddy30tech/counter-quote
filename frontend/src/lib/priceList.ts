import type { PriceList } from '../api';
import type { FeeKind } from './quote';

type FeeOrSetting = FeeKind | 'quoteValidDays';

/** What each fee kind is called on the Price list page, in the order shown there. */
export const FEE_LABELS: Record<FeeOrSetting, string> = {
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

/** The one setting stored with the fees: a number of days, not dollars. */
export const isDays = (kind: string) => kind === 'quoteValidDays';
export const feeLabel = (kind: string) => FEE_LABELS[kind as FeeOrSetting] ?? kind;

// the server's limits (backend Models/PriceList.cs)
const MAX_NAME = 100;
const MAX_RATE = 10_000;
const MAX_FEE = 1_000_000;

const nameKey = (name: string) => name.trim().toLowerCase();
const inRange = (n: number, max: number) => Number.isFinite(n) && n >= 0 && n <= max;
const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Why the price list can't be saved yet, in words for the shop owner. Empty when it can. */
export function priceListProblems(list: PriceList): string[] {
  const problems: string[] = [];
  if (!list.priceGroups.length || !list.materials.length || !list.edgeProfiles.length)
    problems.push('The price list needs at least one price group, one material and one edge profile.');

  const checkNames = (rows: { name: string }[], what: string, plural: string) => {
    if (rows.some((row) => !row.name.trim())) problems.push(`Every ${what} needs a name.`);
    const seen = new Map<string, string>(); // name key → the first row's spelling
    for (const row of rows.filter((row) => row.name.trim())) {
      if (row.name.trim().length > MAX_NAME) problems.push(`${row.name.trim().slice(0, 30)}… is too long; names can have ${MAX_NAME} characters.`);
      const first = seen.get(nameKey(row.name));
      if (first) problems.push(`Two ${plural} are called ${first}.`);
      else seen.set(nameKey(row.name), row.name.trim());
    }
  };
  checkNames(list.priceGroups, 'price group', 'price groups');
  checkNames(list.materials, 'material', 'materials');
  checkNames(list.edgeProfiles, 'edge profile', 'edge profiles');

  for (const group of list.priceGroups)
    for (const rate of group.rates)
      if (!inRange(rate.pricePerSqFt, MAX_RATE)) problems.push(`${group.name} needs a ${rate.thickness} cm price from $0 to ${money(MAX_RATE)}.`);
  for (const material of list.materials)
    if (!list.priceGroups.some((g) => g.id !== 0 && g.id === material.priceGroupId)) problems.push(`${material.name} needs a price group.`);
  for (const profile of list.edgeProfiles)
    if (!inRange(profile.pricePerLinearFt, MAX_RATE)) problems.push(`${profile.name} needs a price from $0 to ${money(MAX_RATE)}.`);
  for (const fee of list.fees) {
    if (isDays(fee.kind)) {
      if (!Number.isInteger(fee.amount) || fee.amount < 1 || fee.amount > 3650) problems.push('Quotes must stay valid for a whole number of days, from 1 to 3,650.');
    } else if (!inRange(fee.amount, MAX_FEE)) problems.push(`${feeLabel(fee.kind)} needs an amount from $0 to ${money(MAX_FEE)}.`);
  }
  return problems;
}
