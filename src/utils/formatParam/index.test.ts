import { describe, expect, it } from 'vitest';
import { formatParam } from '.';

describe('formatParam', () => {
  it('shortens frequencies', () => {
    expect(formatParam(480, { unit: 'Hz', step: 10 })).toBe('480Hz');
    expect(formatParam(1250, { unit: 'Hz', step: 10 })).toBe('1.25k');
    expect(formatParam(12_000, { unit: 'Hz', step: 50 })).toBe('12.0k');
  });

  it('shows short times in milliseconds', () => {
    expect(formatParam(0.481, { unit: 's', step: 0.005 })).toBe('481ms');
    expect(formatParam(0.0025, { unit: 's', step: 0.001 })).toBe('2.5ms');
    expect(formatParam(1.5, { unit: 's', step: 0.01 })).toBe('1.50s');
  });

  it('shows levels, multiples and plain numbers to their step', () => {
    expect(formatParam(-12.5, { unit: 'dB', step: 0.5 })).toBe('-12.5dB');
    expect(formatParam(4, { unit: '×', step: 0.1 })).toBe('4.0×');
    expect(formatParam(5, { step: 1 })).toBe('5');
    expect(formatParam(0.42, { step: 0.01 })).toBe('0.42');
  });
});
