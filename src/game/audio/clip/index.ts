/** Channels of samples at a rate: what a rendered buffer holds. */
export interface Clip {
  channels: Array<Float32Array>;
  sampleRate: number;
}

/** A clip's samples, read out of a rendered buffer. */
export const clipOf = (buffer: {
  numberOfChannels: number;
  sampleRate: number;
  getChannelData: (channel: number) => Float32Array;
}): Clip => ({
  channels: Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
    buffer.getChannelData(channel),
  ),
  sampleRate: buffer.sampleRate,
});

/**
 * One clip `seconds` long with each part laid in at its start and scaled by
 * `gain`. With `wrap`, what runs past the end comes back in at the start,
 * so the clip loops without cutting a tail; without, it's cut.
 */
export const layClips = (
  parts: Array<{ clip: Clip; at: number }>,
  {
    seconds,
    gain = 1,
    wrap = false,
  }: {
    seconds: number;
    gain?: number;
    wrap?: boolean;
  },
): Clip => {
  const sampleRate = parts[0]?.clip.sampleRate ?? 48000;
  const length = Math.max(Math.round(seconds * sampleRate), 1);
  const count = Math.max(...parts.map(({ clip }) => clip.channels.length), 1);
  const channels = Array.from(
    { length: count },
    () => new Float32Array(length),
  );
  parts.forEach(({ clip, at }) => {
    const offset = Math.round(at * sampleRate);
    channels.forEach((out, channel) => {
      // A mono part plays in every channel.
      const samples = clip.channels[channel] ?? clip.channels[0];
      samples.forEach((sample, i) => {
        const index = offset + i;
        if (index < length) out[index] += sample * gain;
        else if (wrap) out[index % length] += sample * gain;
      });
    });
  });
  return { channels, sampleRate };
};

const writeText = (view: DataView, at: number, text: string) =>
  [...text].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)));

/** A clip as a 16-bit PCM WAV file, clipped to full scale. */
export const encodeWav = ({ channels, sampleRate }: Clip): ArrayBuffer => {
  const count = channels.length;
  const frames = channels[0]?.length ?? 0;
  const bytes = frames * count * 2;
  const view = new DataView(new ArrayBuffer(44 + bytes));
  writeText(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes, true);
  writeText(view, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, count, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * count * 2, true);
  view.setUint16(32, count * 2, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, 'data');
  view.setUint32(40, bytes, true);
  Array.from({ length: frames }, (_, frame) =>
    channels.forEach((samples, channel) => {
      const sample = Math.max(-1, Math.min(1, samples[frame]));
      view.setInt16(
        44 + (frame * count + channel) * 2,
        Math.round(sample * 0x7fff),
        true,
      );
    }),
  );
  return view.buffer;
};
