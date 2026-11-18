import { assocPath, path as pathOf } from 'ramda';
import type { SoundDesign } from '.';

export type DesignPath = Array<string | number>;

interface BaseField {
  path: DesignPath;
  label: string;
  /** One line on what the value does, shown under the control. */
  hint?: string;
}

export interface NumberField extends BaseField {
  kind: 'number';
  min: number;
  max: number;
  step: number;
  unit?: 'Hz' | 's' | 'dB' | '×' | '%' | '°' | 'ct';
}

export interface ChoiceField extends BaseField {
  kind: 'choice';
  options: Array<string | number>;
}

/** A list of scale degrees, edited as text ("0, 2, 3, 4"). */
export interface DegreesField extends BaseField {
  kind: 'degrees';
}

export type Field = NumberField | ChoiceField | DegreesField;

export interface FieldGroup {
  id: string;
  title: string;
  description: string;
  fields: Array<Field>;
}

const num = (
  path: DesignPath,
  label: string,
  [min, max, step]: [number, number, number],
  unit?: NumberField['unit'],
  hint?: string,
): NumberField => ({ kind: 'number', path, label, min, max, step, unit, hint });

const envelope = (root: DesignPath): Array<Field> => [
  num([...root, 'attack'], 'Attack', [0.001, 0.2, 0.001], 's'),
  num([...root, 'decay'], 'Decay', [0, 1, 0.005], 's'),
  num([...root, 'sustain'], 'Sustain', [0, 1, 0.01]),
  num([...root, 'release'], 'Release', [0.005, 1, 0.005], 's'),
];

const range = (
  root: DesignPath,
  label: string,
  bounds: [number, number, number],
  unit?: NumberField['unit'],
): Array<Field> => [
  num([...root, 0], `${label} min`, bounds, unit),
  num([...root, 1], `${label} max`, bounds, unit),
];

const ROLLOFFS = [-12, -24, -48];

/** Every knob in the playground, grouped the way the sound is built. */
export const DESIGN_SCHEMA: Array<FieldGroup> = [
  {
    id: 'wobble',
    title: 'Wobble engine',
    description:
      'A detuned oscillator through a resonant low-pass swept by a tempo-synced LFO, over a sine sub.',
    fields: [
      ...envelope(['wobble', 'envelope']),
      num(['wobble', 'voices'], 'Unison voices', [1, 8, 1]),
      num(['wobble', 'spread'], 'Detune spread', [0, 100, 1], 'ct'),
      num(
        ['wobble', 'sweepFloor'],
        'Sweep floor',
        [40, 1200, 5],
        'Hz',
        'Where the filter closes between whobs',
      ),
      num(
        ['wobble', 'phase'],
        'LFO phase',
        [0, 359, 1],
        '°',
        '270 opens each shot from closed',
      ),
      {
        kind: 'choice',
        path: ['wobble', 'rolloff'],
        label: 'Filter slope',
        options: ROLLOFFS,
      },
      num(['wobble', 'subLevel'], 'Sub level', [-40, 6, 0.5], 'dB'),
      num(['wobble', 'subRelease'], 'Sub release', [0.005, 1, 0.005], 's'),
    ],
  },
  {
    id: 'laser',
    title: 'Laser engine',
    description:
      'A bright oscillator whose pitch drops onto each note, with the LFO shimmering the filter.',
    fields: [
      ...envelope(['laser', 'envelope']),
      num(
        ['laser', 'pitchDrop'],
        'Pitch drop',
        [1, 16, 0.1],
        '×',
        'Starts this many times above the note',
      ),
      num(
        ['laser', 'pitchDropSeconds'],
        'Pitch drop time',
        [0.005, 0.5, 0.005],
        's',
      ),
      num(
        ['laser', 'shimmerDepth'],
        'Shimmer low end',
        [0, 1, 0.01],
        '×',
        'Share of the cutoff the LFO dips to',
      ),
      {
        kind: 'choice',
        path: ['laser', 'rolloff'],
        label: 'Filter slope',
        options: ROLLOFFS,
      },
    ],
  },
  {
    id: 'weaponMix',
    title: 'Weapon mix',
    description:
      'How every weapon sits: articulation, drive, switching and the loudness target.',
    fields: [
      num(
        ['weaponMix', 'articulation'],
        'Articulation',
        [0.3, 1, 0.01],
        '×',
        'Share of each slot a note is held',
      ),
      num(['weaponMix', 'driveWet'], 'Drive mix', [0, 1, 0.01]),
      num(
        ['weaponMix', 'holsterFadeSeconds'],
        'Switch fade',
        [0.01, 2, 0.01],
        's',
      ),
      num(['weaponMix', 'subCutHz'], 'Holstered sub cut', [20, 600, 5], 'Hz'),
      num(
        ['weaponMix', 'targetDb'],
        'Loudness target',
        [-40, -6, 0.5],
        'dB',
        'RMS over a bar of held fire',
      ),
    ],
  },
  {
    id: 'parts',
    title: 'Parts pool: what rolls can land on',
    description:
      'The ranges the generator rolls each weapon from. Narrow a range to keep rolls in the sweet spot.',
    fields: [
      {
        kind: 'choice',
        path: ['parts', 'manufacturers', 'vandal', 'waveform'],
        label: 'Vandal waveform',
        options: ['sawtooth', 'square'],
      },
      num(
        ['parts', 'manufacturers', 'vandal', 'drive'],
        'Vandal base drive',
        [0, 0.8, 0.01],
      ),
      {
        kind: 'choice',
        path: ['parts', 'manufacturers', 'lumen', 'waveform'],
        label: 'Lumen waveform',
        options: ['sawtooth', 'square'],
      },
      num(
        ['parts', 'manufacturers', 'lumen', 'drive'],
        'Lumen base drive',
        [0, 0.8, 0.01],
      ),
      num(['parts', 'engines', 'wobble', 'octave'], 'Wobble octave', [0, 4, 1]),
      {
        kind: 'degrees',
        path: ['parts', 'engines', 'wobble', 'degrees'],
        label: 'Wobble riff degrees',
        hint: 'Scale degrees riffs pick from; repeats weigh a degree up',
      },
      ...range(
        ['parts', 'engines', 'wobble', 'cutoff'],
        'Wobble cutoff',
        [200, 12000, 10],
        'Hz',
      ),
      ...range(
        ['parts', 'engines', 'wobble', 'resonance'],
        'Wobble resonance',
        [0, 20, 0.1],
      ),
      num(['parts', 'engines', 'laser', 'octave'], 'Laser octave', [1, 6, 1]),
      {
        kind: 'degrees',
        path: ['parts', 'engines', 'laser', 'degrees'],
        label: 'Laser riff degrees',
      },
      ...range(
        ['parts', 'engines', 'laser', 'cutoff'],
        'Laser cutoff',
        [200, 16000, 10],
        'Hz',
      ),
      ...range(
        ['parts', 'engines', 'laser', 'resonance'],
        'Laser resonance',
        [0, 20, 0.1],
      ),
      ...range(['parts', 'crush', 'drive'], 'Crush drive', [0, 0.8, 0.01]),
      ...range(['parts', 'echo', 'feedback'], 'Echo feedback', [0, 0.9, 0.01]),
      ...range(['parts', 'echo', 'wet'], 'Echo wet', [0, 1, 0.01]),
    ],
  },
  {
    id: 'drums',
    title: 'Drums',
    description: 'The synthesized kit. The kick is tuned to the level root.',
    fields: [
      num(['drums', 'level'], 'Kit level', [-40, 6, 0.5], 'dB'),
      num(['drums', 'kick', 'level'], 'Kick level', [-40, 12, 0.5], 'dB'),
      num(
        ['drums', 'kick', 'pitchMultiple'],
        'Kick pitch drop',
        [1, 16, 0.1],
        '×',
      ),
      num(
        ['drums', 'kick', 'pitchSeconds'],
        'Kick drop time',
        [0.005, 0.3, 0.005],
        's',
      ),
      num(['drums', 'kick', 'decay'], 'Kick decay', [0.05, 2, 0.01], 's'),
      num(
        ['drums', 'snare', 'noiseHz'],
        'Snare noise high-pass',
        [200, 8000, 10],
        'Hz',
      ),
      num(
        ['drums', 'snare', 'noiseDecay'],
        'Snare noise decay',
        [0.02, 1, 0.005],
        's',
      ),
      num(
        ['drums', 'snare', 'noiseLevel'],
        'Snare noise level',
        [-40, 12, 0.5],
        'dB',
      ),
      num(['drums', 'snare', 'bodyHz'], 'Snare body pitch', [60, 400, 1], 'Hz'),
      num(
        ['drums', 'snare', 'bodyDecay'],
        'Snare body decay',
        [0.02, 1, 0.005],
        's',
      ),
      num(
        ['drums', 'snare', 'bodyLevel'],
        'Snare body level',
        [-40, 12, 0.5],
        'dB',
      ),
      num(
        ['drums', 'snare', 'roomDecay'],
        'Snare room size',
        [0.1, 6, 0.05],
        's',
      ),
      num(['drums', 'snare', 'roomWet'], 'Snare room mix', [0, 1, 0.01]),
      num(['drums', 'hat', 'hz'], 'Hat high-pass', [2000, 16000, 50], 'Hz'),
      num(['drums', 'hat', 'decay'], 'Hat decay', [0.005, 0.3, 0.005], 's'),
      num(['drums', 'hat', 'level'], 'Hat level', [-40, 6, 0.5], 'dB'),
      num(
        ['drums', 'openHat', 'hz'],
        'Open hat high-pass',
        [2000, 16000, 50],
        'Hz',
      ),
      num(
        ['drums', 'openHat', 'decay'],
        'Open hat decay',
        [0.05, 1.5, 0.01],
        's',
      ),
      num(['drums', 'openHat', 'level'], 'Open hat level', [-40, 6, 0.5], 'dB'),
    ],
  },
  {
    id: 'impact',
    title: 'Kill impact',
    description:
      'A noise crunch over a sub thump on the root, scheduled on the next 1/16.',
    fields: [
      num(['impact', 'level'], 'Level', [-40, 6, 0.5], 'dB'),
      num(['impact', 'crunchHz'], 'Crunch pitch', [100, 8000, 10], 'Hz'),
      num(['impact', 'crunchQ'], 'Crunch focus', [0.1, 20, 0.1]),
      num(['impact', 'crunchDecay'], 'Crunch decay', [0.01, 1, 0.005], 's'),
      num(['impact', 'crunchLevel'], 'Crunch level', [-40, 12, 0.5], 'dB'),
      num(['impact', 'thumpMultiple'], 'Thump pitch drop', [1, 16, 0.1], '×'),
      num(
        ['impact', 'thumpSeconds'],
        'Thump drop time',
        [0.005, 0.5, 0.005],
        's',
      ),
      num(['impact', 'thumpDecay'], 'Thump decay', [0.02, 2, 0.01], 's'),
      num(['impact', 'thumpLevel'], 'Thump level', [-40, 12, 0.5], 'dB'),
    ],
  },
  {
    id: 'reload',
    title: 'Reload fill',
    description:
      'The click on the offbeat and the rumble rising into the return.',
    fields: [
      num(['reload', 'level'], 'Level', [-40, 6, 0.5], 'dB'),
      num(['reload', 'clickHz'], 'Click pitch', [200, 12000, 10], 'Hz'),
      num(['reload', 'clickLevel'], 'Click level', [-40, 12, 0.5], 'dB'),
      num(['reload', 'rumbleFrom'], 'Rumble from', [20, 2000, 5], 'Hz'),
      num(['reload', 'rumbleTo'], 'Rumble to', [100, 8000, 10], 'Hz'),
      num(['reload', 'rumbleLevel'], 'Rumble level', [-40, 12, 0.5], 'dB'),
    ],
  },
  {
    id: 'arrangement',
    title: 'Arrangement',
    description:
      'How the track opens with the fight, and what a drop hits with.',
    fields: [
      num(['arrangement', 'level'], 'FX level', [-40, 6, 0.5], 'dB'),
      num(
        ['arrangement', 'calmHz'],
        'Calm filter',
        [100, 20000, 10],
        'Hz',
        'How open the track is in the intro',
      ),
      num(
        ['arrangement', 'grooveHz'],
        'Groove filter',
        [100, 20000, 10],
        'Hz',
        'How open it is while a few enemies are up',
      ),
      num(['arrangement', 'riserFrom'], 'Riser from', [50, 4000, 10], 'Hz'),
      num(['arrangement', 'riserTo'], 'Riser to', [500, 18000, 50], 'Hz'),
      num(['arrangement', 'riserLevel'], 'Riser level', [-40, 12, 0.5], 'dB'),
      num(
        ['arrangement', 'crashHz'],
        'Crash high-pass',
        [200, 12000, 10],
        'Hz',
      ),
      num(['arrangement', 'crashDecay'], 'Crash decay', [0.1, 6, 0.05], 's'),
      num(['arrangement', 'crashLevel'], 'Crash level', [-40, 12, 0.5], 'dB'),
      num(['arrangement', 'boomDecay'], 'Boom decay', [0.1, 4, 0.05], 's'),
      num(['arrangement', 'boomLevel'], 'Boom level', [-40, 12, 0.5], 'dB'),
    ],
  },
];

export const valueAt = (design: SoundDesign, path: DesignPath): unknown =>
  pathOf(path, design);

/** A new design with one value changed. */
export const withValue = (
  design: SoundDesign,
  path: DesignPath,
  value: unknown,
): SoundDesign => assocPath(path, value, design);

/** "0, 2, 3" → [0, 2, 3]; null if it isn't a list of whole numbers. */
export const parseDegrees = (text: string): Array<number> | null => {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const degrees = parts.map(Number);
  const valid =
    degrees.length > 0 &&
    degrees.every(degree => Number.isInteger(degree) && Math.abs(degree) <= 21);
  return valid ? degrees : null;
};
