import { describe, expect, it } from 'vitest';
import { getLatencyHint } from '.';

const desktop = { touch: false, firefox: false };
const firefoxPhone = { touch: true, firefox: true };
const phone = { touch: true, firefox: false };

describe('getLatencyHint', () => {
  it('asks for a balanced buffer on a desktop', () => {
    expect(getLatencyHint('', desktop)).toBe('balanced');
    expect(getLatencyHint('', { touch: false, firefox: true })).toBe(
      'balanced',
    );
  });

  it('asks for the biggest buffer in Firefox on a touch screen', () => {
    expect(getLatencyHint('', firefoxPhone)).toBe('playback');
  });

  it('asks for the smallest buffer in other browsers on a touch screen', () => {
    expect(getLatencyHint('', phone)).toBe('interactive');
  });

  it('takes a hint from the query string over any default', () => {
    expect(getLatencyHint('?latency=playback', desktop)).toBe('playback');
    expect(getLatencyHint('?seed=4&latency=interactive', firefoxPhone)).toBe(
      'interactive',
    );
  });

  it('ignores a hint the browser would reject', () => {
    expect(getLatencyHint('?latency=fast', desktop)).toBe('balanced');
    expect(getLatencyHint('?latency=fast', firefoxPhone)).toBe('playback');
    expect(getLatencyHint('?latency=fast', phone)).toBe('interactive');
  });
});
