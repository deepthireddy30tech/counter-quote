import { describe, expect, it } from 'vitest';
import { formatMeasurement, parseMeasurement } from './measure';

describe('parseMeasurement (inches)', () => {
  it('reads plain inches', () => {
    expect(parseMeasurement('126', 'in')).toBe(126);
  });

  it.each([
    ["10'6", 126],
    ["10' 6\"", 126],
    ["10'", 120],
    ['10ft 6in', 126],
  ])('reads feet and inches: %s', (text, inches) => {
    expect(parseMeasurement(text, 'in')).toBe(inches);
  });

  it.each([
    ['25 1/2', 25.5],
    ['25-1/2', 25.5],
    ['3/4', 0.75],
    ["2' 1 3/8\"", 25.375],
    ['25.5', 25.5],
  ])('reads fractions and decimals: %s', (text, inches) => {
    expect(parseMeasurement(text, 'in')).toBe(inches);
  });

  it.each([
    ['25.06', 25],
    ['25.07', 25.125],
    ['25 1/16', 25.125],
    ['25 1/3', 25.375],
  ])('rounds to the nearest 1/8 inch: %s', (text, inches) => {
    expect(parseMeasurement(text, 'in')).toBe(inches);
  });

  it.each([
    ["10'-6", 126],
    ["10'-6\"", 126],
    ["10'1/2", 120.5],
    ['10 FT 6 IN', 126],
    ['.5', 0.5],
    ["1.5'", 18],
  ])('reads common shop variants: %s', (text, inches) => {
    expect(parseMeasurement(text, 'in')).toBe(inches);
  });

  it('reads feet followed by a bare fraction', () => {
    expect(parseMeasurement("2' 3/8\"", 'in')).toBe(24.375);
  });

  it('ignores surrounding spaces and curly quotes', () => {
    expect(parseMeasurement('  10′ 6″ ', 'in')).toBe(126);
  });

  it.each(['', '   ', 'abc', '0', "0' 0", '-5', '1/0', "10'6'", '5 5', '12 ft ft', '1/32', '-1/2', '-3/4', "-10'", '5/4', '25 5/4', '25.5 1/2', '3/0'])(
    'refuses %j: not a usable size',
    (text) => {
      expect(parseMeasurement(text, 'in')).toBeNull();
    },
  );
});

describe('parseMeasurement (metric)', () => {
  // 3.2 m = 125.98", 65 cm = 25.59": stored as inches rounded to the nearest 1/8"
  it.each([
    ['3.2', 126],
    ['3.2 m', 126],
    ['65 cm', 25.625],
    ['650mm', 25.625],
    ['0.65 M', 25.625],
  ])('reads %s as metric when the unit is metres', (text, inches) => {
    expect(parseMeasurement(text, 'm')).toBe(inches);
  });

  it('reads a metric suffix even when the unit is inches', () => {
    expect(parseMeasurement('65 cm', 'in')).toBe(25.625);
  });

  it('still reads explicit feet and inches when the unit is metres', () => {
    expect(parseMeasurement("10'6", 'm')).toBe(126);
    expect(parseMeasurement('25 1/2"', 'm')).toBe(25.5);
  });

  it.each(['', '0', '1 mm', 'm', '3.2 km', '25 1/2'])('refuses %j in metres', (text) => {
    expect(parseMeasurement(text, 'm')).toBeNull();
  });
});

describe('formatMeasurement', () => {
  it.each([
    [126, '10′ 6″'],
    [120, '10′ 0″'],
    [24.375, '2′ 0 3/8″'],
    [25.5, '2′ 1 1/2″'],
    [23.5, '23 1/2″'],
    [0.75, '3/4″'],
    [25.125, '2′ 1 1/8″'],
  ])('shows %d inches as %s', (inches, text) => {
    expect(formatMeasurement(inches, 'in')).toBe(text);
  });

  it.each([
    [120, '3.048 m'],
    [126, '3.2 m'],
    [25.5, '64.8 cm'],
  ])('shows %d inches in metric as %s', (inches, text) => {
    expect(formatMeasurement(inches, 'm')).toBe(text);
  });

  // every 1/8" from 1/8" to 20 ft survives format -> parse in both units
  it.each(['in', 'm'] as const)('round-trips every 1/8 inch through %s', (unit) => {
    for (let e = 1; e <= 240 * 8; e++) {
      const inches = e / 8;
      expect(parseMeasurement(formatMeasurement(inches, unit), unit), formatMeasurement(inches, unit)).toBe(inches);
    }
  });
});
