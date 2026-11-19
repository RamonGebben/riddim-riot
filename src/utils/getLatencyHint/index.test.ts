import { describe, expect, it } from 'vitest';
import { getLatencyHint } from '.';

const desktop = { touch: false };
const phone = { touch: true };

describe('getLatencyHint', () => {
  it('asks for a balanced buffer on a desktop', () => {
    expect(getLatencyHint('', desktop)).toBe('balanced');
  });

  it('asks for the biggest buffer on a touch screen', () => {
    expect(getLatencyHint('', phone)).toBe('playback');
  });

  it('takes a hint from the query string over either default', () => {
    expect(getLatencyHint('?latency=playback', desktop)).toBe('playback');
    expect(getLatencyHint('?seed=4&latency=interactive', phone)).toBe(
      'interactive',
    );
  });

  it('ignores a hint the browser would reject', () => {
    expect(getLatencyHint('?latency=fast', desktop)).toBe('balanced');
    expect(getLatencyHint('?latency=fast', phone)).toBe('playback');
  });
});
