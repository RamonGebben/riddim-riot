export type ParamUnit = 'Hz' | 's' | 'dB' | '×' | '%' | '°' | 'ct';

const decimalsOf = (step: number) =>
  Math.max(0, Math.min(3, -Math.floor(Math.log10(step))));

/**
 * A value as a panel's readout shows it, short enough for a knob's width:
 * 1.20k, 480ms, -12.5dB. Whole-number steps show whole numbers.
 */
export const formatParam = (
  value: number,
  { unit, step }: { unit?: ParamUnit; step: number },
): string => {
  const fixed = (number: number, decimals = decimalsOf(step)) =>
    number.toFixed(decimals);
  if (unit === 'Hz') {
    return value >= 1000
      ? `${fixed(value / 1000, value >= 10_000 ? 1 : 2)}k`
      : `${fixed(value, 0)}Hz`;
  }
  if (unit === 's') {
    return value < 1
      ? `${fixed(value * 1000, value < 0.01 ? 1 : 0)}ms`
      : `${fixed(value, 2)}s`;
  }
  if (unit === 'dB') return `${fixed(value, step < 1 ? 1 : 0)}dB`;
  if (unit === '%') return `${fixed(value * 100, 0)}%`;
  if (unit === '×') return `${fixed(value, Math.max(1, decimalsOf(step)))}×`;
  if (unit === '°') return `${fixed(value, 0)}°`;
  if (unit === 'ct') return `${fixed(value, 0)}ct`;
  return fixed(value);
};
