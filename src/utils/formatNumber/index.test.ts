import { describe, expect, it } from 'vitest';
import { formatNumber } from '.';

describe('formatNumber', () => {
  it('groups thousands with commas', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(12_400)).toBe('12,400');
    expect(formatNumber(1_234_567)).toBe('1,234,567');
  });
});
