export type Unit = 'in' | 'm';

const NUM = String.raw`\d+(?:\.\d+)?`;
// [feet ' or ft] [whole inches] [fraction n/d] [" or in]; whole and fraction may be joined by a space or hyphen
const FEET_INCHES = new RegExp(
  String.raw`^(?:(${NUM})\s*(?:'|ft))?\s*(${NUM})?(?:(?:\s+|-|^)(\d+)/(\d+))?\s*(?:"|in)?$`,
);

const METRIC = new RegExp(String.raw`^(${NUM})\s*(mm|cm|m)$`, 'i');
const BARE_NUMBER = new RegExp(`^${NUM}$`);
const INCHES_PER = { mm: 1 / 25.4, cm: 1 / 2.54, m: 1 / 0.0254 } as const;

const toEighths = (inches: number) => Math.round(inches * 8) / 8;

/**
 * Reads a size typed on site and returns decimal inches rounded to the nearest 1/8",
 * or null if it can't be read or isn't above zero.
 * With unit 'm' a bare number means metres; m/cm/mm suffixes and ' " marks work in either unit.
 */
export function parseLength(text: string, unit: Unit): number | null {
  const t = text.trim().replace(/[′’‘]/g, "'").replace(/[″”“]/g, '"');
  const inches = readMetric(t, unit) ?? readFeetInches(t, unit);
  if (inches == null) return null;
  const rounded = toEighths(inches);
  return Number.isFinite(rounded) && rounded > 0 ? rounded : null;
}

/**
 * Shows inches the way a shop writes them (10′ 6″, 23 1/2″), or in metric (3.048 m, 64.8 cm).
 * The text always parses back to the same 1/8" value.
 */
export function formatLength(inches: number, unit: Unit): string {
  if (unit === 'm') {
    const metres = inches * 0.0254;
    return metres >= 1 ? `${+metres.toFixed(3)} m` : `${+(metres * 100).toFixed(1)} cm`;
  }
  const eighths = Math.round(inches * 8);
  const whole = Math.floor(eighths / 8);
  const rest = eighths % 8;
  const fraction = rest ? `${rest / gcd(rest, 8)}/${8 / gcd(rest, 8)}` : '';
  if (whole < 24) return `${[whole || '', fraction].filter(Boolean).join(' ') || '0'}″`;
  return `${Math.floor(whole / 12)}′ ${[whole % 12, fraction].filter((p) => p !== '').join(' ')}″`;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

function readMetric(t: string, unit: Unit): number | null {
  const m = t.match(METRIC) ?? (unit === 'm' && BARE_NUMBER.test(t) ? [t, t, 'm'] : null);
  return m ? Number(m[1]) * INCHES_PER[m[2].toLowerCase() as keyof typeof INCHES_PER] : null;
}

function readFeetInches(t: string, unit: Unit): number | null {
  // in metres, only accept imperial when a ' or " mark says so
  if (unit === 'm' && !/['"]|ft|in/.test(t)) return null;
  const m = t.match(FEET_INCHES);
  if (!m) return null;
  const [, feet, whole, num, den] = m;
  return Number(feet ?? 0) * 12 + Number(whole ?? 0) + (num ? Number(num) / Number(den) : 0);
}
