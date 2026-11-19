import { describe, expect, it } from 'vitest';
import { getLatencyHint } from '.';

describe('getLatencyHint', () => {
  it('asks for a balanced buffer by default', () => {
    expect(getLatencyHint('')).toBe('balanced');
  });

  it('takes a hint from the query string', () => {
    expect(getLatencyHint('?latency=playback')).toBe('playback');
    expect(getLatencyHint('?seed=4&latency=interactive')).toBe('interactive');
  });

  it('ignores a hint the browser would reject', () => {
    expect(getLatencyHint('?latency=fast')).toBe('balanced');
  });
});
