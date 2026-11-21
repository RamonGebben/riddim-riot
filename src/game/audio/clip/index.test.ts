import { describe, expect, it } from 'vitest';
import { encodeWav, layClips, type Clip } from '.';

const clip = (samples: Array<number>, sampleRate = 10): Clip => ({
  channels: [Float32Array.from(samples)],
  sampleRate,
});

describe('layClips', () => {
  it('lays each part in at its start, scaled', () => {
    const laid = layClips(
      [
        { clip: clip([1, 1]), at: 0 },
        { clip: clip([0.5]), at: 0.3 },
      ],
      { seconds: 0.5, gain: 2 },
    );
    expect([...laid.channels[0]]).toEqual([2, 2, 0, 1, 0]);
  });

  it('cuts what runs past the end', () => {
    const laid = layClips([{ clip: clip([1, 1, 1]), at: 0.2 }], {
      seconds: 0.4,
    });
    expect([...laid.channels[0]]).toEqual([0, 0, 1, 1]);
  });

  it('brings a tail back in at the start when it wraps, so it loops whole', () => {
    const laid = layClips([{ clip: clip([1, 0.5, 0.25]), at: 0.2 }], {
      seconds: 0.4,
      wrap: true,
    });
    expect([...laid.channels[0]]).toEqual([0.25, 0, 1, 0.5]);
  });

  it('plays a mono part in every channel of a stereo one', () => {
    const stereo: Clip = {
      channels: [Float32Array.from([0.1]), Float32Array.from([0.2])],
      sampleRate: 10,
    };
    const laid = layClips(
      [
        { clip: stereo, at: 0 },
        { clip: clip([0.5]), at: 0 },
      ],
      { seconds: 0.1 },
    );
    expect(laid.channels.map(samples => samples[0])).toEqual([
      expect.closeTo(0.6),
      expect.closeTo(0.7),
    ]);
  });
});

describe('encodeWav', () => {
  it('writes a 16-bit PCM header for the clip', () => {
    const view = new DataView(
      encodeWav({
        channels: [new Float32Array(3), new Float32Array(3)],
        sampleRate: 44100,
      }),
    );
    const text = (at: number) =>
      String.fromCharCode(...[0, 1, 2, 3].map(i => view.getUint8(at + i)));
    expect([text(0), text(8), text(12), text(36)]).toEqual([
      'RIFF',
      'WAVE',
      'fmt ',
      'data',
    ]);
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint32(40, true)).toBe(12);
    expect(view.byteLength).toBe(56);
  });

  it('interleaves the channels and clips to full scale', () => {
    const view = new DataView(
      encodeWav({
        channels: [Float32Array.from([0.5, 2]), Float32Array.from([-1, 0])],
        sampleRate: 8000,
      }),
    );
    expect([0, 1, 2, 3].map(i => view.getInt16(44 + i * 2, true))).toEqual([
      Math.round(0.5 * 0x7fff),
      -0x7fff,
      0x7fff,
      0,
    ]);
  });
});
