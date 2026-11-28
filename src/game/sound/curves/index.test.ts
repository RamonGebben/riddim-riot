import { describe, expect, it } from 'vitest';
import {
  decayPoints,
  dropPoints,
  envelopePoints,
  filterGainDb,
  hzToX,
  pumpPoints,
  sweepPoints,
  xToHz,
} from '.';

describe('the spectrum axis', () => {
  it('runs 20 Hz to 20 kHz, logarithmically', () => {
    expect(hzToX(20)).toBeCloseTo(0);
    expect(hzToX(20_000)).toBeCloseTo(1);
    expect(hzToX(632.5)).toBeCloseTo(0.5, 2);
  });

  it('turns back into Hz', () => {
    expect(xToHz(hzToX(440))).toBeCloseTo(440);
  });
});

describe('filterGainDb', () => {
  const lowpass = { kind: 'lowpass', hz: 1000, q: 0.707 } as const;

  it('passes the lows of a low-pass and cuts the highs', () => {
    expect(filterGainDb(lowpass, 50)).toBeCloseTo(0, 1);
    expect(filterGainDb(lowpass, 1000)).toBeCloseTo(-3, 0);
    expect(filterGainDb(lowpass, 8000)).toBeLessThan(-30);
  });

  it('peaks at the cutoff as the resonance rises', () => {
    expect(filterGainDb({ ...lowpass, q: 8 }, 1000)).toBeCloseTo(18, 0);
  });

  it('cuts twice as hard per extra -12 dB of rolloff', () => {
    const single = filterGainDb(lowpass, 4000);
    expect(filterGainDb({ ...lowpass, rolloff: -24 }, 4000)).toBeCloseTo(
      single * 2,
    );
  });

  it('lets a band through a band-pass', () => {
    const band = { kind: 'bandpass', hz: 1000, q: 4 } as const;
    expect(filterGainDb(band, 1000)).toBeCloseTo(0, 1);
    expect(filterGainDb(band, 100)).toBeLessThan(-20);
  });

  it('cuts the lows of a high-pass', () => {
    const high = { kind: 'highpass', hz: 200, q: 0.707 } as const;
    expect(filterGainDb(high, 20)).toBeLessThan(-30);
    expect(filterGainDb(high, 5000)).toBeCloseTo(0, 1);
  });
});

describe('envelopePoints', () => {
  const envelope = { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 };

  it('rises linearly to full, then settles toward the sustain', () => {
    const points = envelopePoints(envelope, 0.5);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[1]).toEqual({ x: 0.01, y: 1 });
    const held = points.find(point => point.x === 0.5);
    expect(held?.y).toBeCloseTo(0.525, 2);
  });

  it('releases toward silence over the release', () => {
    const last = envelopePoints(envelope, 0.5).at(-1);
    expect(last?.x).toBeCloseTo(0.8);
    expect(last?.y).toBeLessThan(0.05);
  });

  it('holds no shorter than the attack and decay', () => {
    const points = envelopePoints(envelope, 0);
    expect(points.find(point => point.y === points[26].y)?.x).toBeCloseTo(0.21);
  });
});

describe('the other shapes', () => {
  it('decays a one-shot from full', () => {
    const points = decayPoints(0.4);
    expect(points[0]).toEqual({ x: 0, y: 1 });
    expect(points.at(-1)?.x).toBeCloseTo(0.4);
    expect(points.at(-1)?.y).toBeCloseTo(Math.exp(-3));
  });

  it('starts a 270° sweep at its floor', () => {
    const points = sweepPoints({ min: 100, max: 1100, phase: 270, cycles: 2 });
    expect(points[0].hz).toBeCloseTo(100);
    expect(Math.max(...points.map(point => point.hz))).toBeCloseTo(1100, -1);
  });

  it('drops a pitch onto the note', () => {
    const points = dropPoints(4, 0.1, 0.2);
    expect(points[0].y).toBeCloseTo(4);
    expect(points.at(-1)?.y).toBeCloseTo(1);
  });

  it('ducks by the depth and swells back by the time given', () => {
    const points = pumpPoints(-12, 0.2, 0.4);
    expect(points[0].y).toBeCloseTo(-12);
    expect(points.at(-1)?.y).toBeCloseTo(0);
  });
});
