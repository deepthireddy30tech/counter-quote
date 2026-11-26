export type Unit = 'in' | 'm';

const NUM = String.raw`(?:\d+(?:\.\d*)?|\.\d+)`;
// [feet ' or ft, optional hyphen] [inches part] [" or in]
const FEET_INCHES = new RegExp(String.raw`^(?:(${NUM})\s*(?:'|ft)\s*-?)?\s*(.*?)\s*(?:"|in)?$`, 'i');
// inches part: a number, or [whole inches + space/hyphen] n/d with n < d
const DECIMAL = new RegExp(`^${NUM}$`);
const FRACTION = /^(?:(\d+)(?:\s+|-))?(\d+)\/(\d+)$/;
const METRIC = new RegExp(String.raw`^(${NUM})\s*(mm|cm|m)$`, 'i');
const INCHES_PER_METRE = 1 / 0.0254;
const INCHES_PER = { mm: INCHES_PER_METRE / 1000, cm: INCHES_PER_METRE / 100, m: INCHES_PER_METRE } as const;

const toEighths = (inches: number) => Math.round(inches * 8) / 8;

/**
 * Reads a measurement typed on site (a length, depth or centerline) and returns decimal inches
 * rounded to the nearest 1/8", or null if it can't be read or isn't above zero.
 * With unit 'm' a bare number means metres; m/cm/mm suffixes and ' " marks work in either unit.
 */
export function parseMeasurement(text: string, unit: Unit): number | null {
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
export function formatMeasurement(inches: number, unit: Unit): string {
  if (unit === 'm') {
    const metres = inches / INCHES_PER_METRE;
    return metres >= 1 ? `${+metres.toFixed(3)} m` : `${+(metres * 100).toFixed(1)} cm`;
  }
  const eighths = Math.round(inches * 8);
  const whole = Math.floor(eighths / 8);
  const rest = eighths % 8;
  const g = gcd(rest, 8);
  const fraction = rest ? `${rest / g}/${8 / g}` : '';
  if (whole < 24) return `${[whole || '', fraction].filter(Boolean).join(' ') || '0'}″`;
  return `${Math.floor(whole / 12)}′ ${[whole % 12, fraction].filter((p) => p !== '').join(' ')}″`;
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

function readMetric(t: string, unit: Unit): number | null {
  if (unit === 'm' && DECIMAL.test(t)) return Number(t) * INCHES_PER.m; // bare number means metres
  const m = t.match(METRIC);
  return m ? Number(m[1]) * INCHES_PER[m[2].toLowerCase() as keyof typeof INCHES_PER] : null;
}

function readFeetInches(t: string, unit: Unit): number | null {
  // in metres, only accept imperial when a ' " ft or in mark says so
  if (unit === 'm' && !/['"]|ft|in/i.test(t)) return null;
  const m = t.match(FEET_INCHES);
  if (!m) return null;
  const [, feet, rest] = m;
  const inches = rest ? readInches(rest) : 0;
  return inches == null ? null : Number(feet ?? 0) * 12 + inches;
}

function readInches(s: string): number | null {
  if (DECIMAL.test(s)) return Number(s);
  const f = s.match(FRACTION);
  if (!f || Number(f[2]) >= Number(f[3])) return null;
  return Number(f[1] ?? 0) + Number(f[2]) / Number(f[3]);
}
