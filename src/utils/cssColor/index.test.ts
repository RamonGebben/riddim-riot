import { describe, expect, it } from 'vitest';
import { cssColor } from '.';

describe('cssColor', () => {
  it('writes six hex digits, padding dark colours', () => {
    expect([0xffd23f, 0x00ff00, 0x0000ff, 0].map(cssColor)).toEqual([
      '#ffd23f',
      '#00ff00',
      '#0000ff',
      '#000000',
    ]);
  });
});
