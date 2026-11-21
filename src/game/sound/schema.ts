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

const layers = (engine: 'wobble' | 'laser', title: string): FieldGroup => {
  const at = (...rest: DesignPath): DesignPath => [engine, 'layers', ...rest];
  return {
    id: `${engine}Layers`,
    title,
    description:
      'What stacks around the body: a clean sub, a detuned stack, a growl on top and a click for the hit.',
    fields: [
      num(
        at('crossoverHz'),
        'Crossover',
        [20, 400, 5],
        'Hz',
        'The body is high-passed here so the sub alone owns the lows',
      ),
      num(at('sub', 'level'), 'Sub level', [-40, 6, 0.5], 'dB'),
      {
        kind: 'choice',
        path: at('sub', 'octavesDown'),
        label: 'Sub octaves down',
        options: [1, 2, 3],
      },
      num(
        at('sub', 'saturation'),
        'Sub saturation',
        [0, 1, 0.01],
        undefined,
        'Harmonics so the sub reads on small speakers',
      ),
      num(at('sub', 'release'), 'Sub release', [0.005, 1, 0.005], 's'),
      num(at('stack', 'level'), 'Stack level', [-40, 6, 0.5], 'dB'),
      {
        kind: 'choice',
        path: at('stack', 'octave'),
        label: 'Stack octave',
        options: [-1, 0, 1],
      },
      num(
        at('stack', 'detune'),
        'Stack detune',
        [0, 100, 1],
        'ct',
        'Two voices through the body filter; -1 octave is a reese',
      ),
      num(at('growl', 'level'), 'Growl level', [-40, 6, 0.5], 'dB'),
      {
        kind: 'choice',
        path: at('growl', 'octave'),
        label: 'Growl octave',
        options: [0, 1, 2],
      },
      num(at('growl', 'floorHz'), 'Growl sweep floor', [50, 4000, 10], 'Hz'),
      num(
        at('growl', 'peak'),
        'Growl sweep peak',
        [0.2, 4, 0.05],
        '×',
        'Times the rolled cutoff',
      ),
      num(at('growl', 'q'), 'Growl focus', [0.1, 20, 0.1]),
      num(at('growl', 'saturation'), 'Growl saturation', [0, 1, 0.01]),
      num(at('click', 'level'), 'Click level', [-40, 6, 0.5], 'dB'),
      num(at('click', 'hz'), 'Click pitch', [200, 12000, 10], 'Hz'),
      num(at('click', 'decay'), 'Click decay', [0.002, 0.2, 0.001], 's'),
    ],
  };
};

/** Every knob in the playground, grouped the way the sound is built. */
export const DESIGN_SCHEMA: Array<FieldGroup> = [
  {
    id: 'wobble',
    title: 'Wobble engine',
    description:
      'The body: a detuned oscillator through a resonant low-pass swept by a tempo-synced LFO.',
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
    ],
  },
  layers('wobble', 'Wobble layers'),
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
  layers('laser', 'Laser layers'),
  {
    id: 'beam',
    title: 'Beam engine',
    description:
      'A held note per beat that glides through the riff, its filter pulsed by the LFO, over a held sub and sizzle. Opened when firing starts, closed when it stops.',
    fields: [
      ...envelope(['beam', 'envelope']),
      num(['beam', 'voices'], 'Unison voices', [1, 8, 1]),
      num(['beam', 'spread'], 'Detune spread', [0, 100, 1], 'ct'),
      num(
        ['beam', 'glideSeconds'],
        'Glide',
        [0.001, 0.5, 0.001],
        's',
        'How long it slides from note to note',
      ),
      num(
        ['beam', 'sweepFloor'],
        'Pulse floor',
        [40, 4000, 10],
        'Hz',
        'Where the LFO pulls the filter down to',
      ),
      {
        kind: 'choice',
        path: ['beam', 'rolloff'],
        label: 'Filter slope',
        options: ROLLOFFS,
      },
      num(['beam', 'topLevel'], 'Octave-up square', [-40, 6, 0.5], 'dB'),
      num(['beam', 'sub', 'level'], 'Sub level', [-40, 6, 0.5], 'dB'),
      {
        kind: 'choice',
        path: ['beam', 'sub', 'octavesDown'],
        label: 'Sub octaves down',
        options: [1, 2, 3],
      },
      num(['beam', 'sub', 'saturation'], 'Sub saturation', [0, 1, 0.01]),
      num(['beam', 'sizzle', 'level'], 'Sizzle level', [-60, 6, 0.5], 'dB'),
      num(
        ['beam', 'sizzle', 'hz'],
        'Sizzle high-pass',
        [1000, 16000, 50],
        'Hz',
      ),
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
      num(
        ['weaponMix', 'glueThreshold'],
        'Glue threshold',
        [-60, 0, 0.5],
        'dB',
        'A compressor squeezing the layers into one sound',
      ),
      num(['weaponMix', 'glueRatio'], 'Glue ratio', [1, 20, 0.1], '×'),
    ],
  },
  {
    id: 'mix',
    title: 'Sidechain',
    description:
      'The kick ducks the pad bed and the weapons, so the beat breathes.',
    fields: [
      num(['mix', 'bedPumpDb'], 'Bed duck', [-40, 0, 0.5], 'dB'),
      num(['mix', 'weaponPumpDb'], 'Weapon duck', [-40, 0, 0.5], 'dB'),
      num(['mix', 'pumpSeconds'], 'Swell back', [0.02, 1, 0.01], 's'),
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
      num(['parts', 'engines', 'beam', 'octave'], 'Beam octave', [1, 6, 1]),
      {
        kind: 'degrees',
        path: ['parts', 'engines', 'beam', 'degrees'],
        label: 'Beam riff degrees',
        hint: 'One note per beat',
      },
      ...range(
        ['parts', 'engines', 'beam', 'cutoff'],
        'Beam cutoff',
        [200, 16000, 10],
        'Hz',
      ),
      ...range(
        ['parts', 'engines', 'beam', 'resonance'],
        'Beam resonance',
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
      num(
        ['drums', 'drive'],
        'Kit drive',
        [0, 1, 0.01],
        undefined,
        'Soft-clips the whole kit for weight; 0 bypasses it',
      ),
      num(
        ['drums', 'glueThreshold'],
        'Kit glue threshold',
        [-40, 0, 0.5],
        'dB',
      ),
      num(['drums', 'glueRatio'], 'Kit glue ratio', [1, 20, 0.1], '×'),
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
        ['drums', 'kick', 'clickHz'],
        'Kick click pitch',
        [200, 12000, 10],
        'Hz',
      ),
      num(
        ['drums', 'kick', 'clickDecay'],
        'Kick click decay',
        [0.001, 0.1, 0.001],
        's',
      ),
      num(
        ['drums', 'kick', 'clickLevel'],
        'Kick click level',
        [-40, 12, 0.5],
        'dB',
      ),
      num(
        ['drums', 'kick', 'subDecay'],
        'Kick sub tail',
        [0.05, 3, 0.01],
        's',
        'A longer, quieter decay on the same sine',
      ),
      num(
        ['drums', 'kick', 'subLevel'],
        'Kick sub level',
        [-40, 12, 0.5],
        'dB',
      ),
      num(
        ['drums', 'kick', 'knockDecay'],
        'Kick knock decay',
        [0.005, 0.5, 0.005],
        's',
        'A triangle an octave up, for punch on small speakers',
      ),
      num(
        ['drums', 'kick', 'knockLevel'],
        'Kick knock level',
        [-40, 12, 0.5],
        'dB',
      ),
      num(
        ['drums', 'kick', 'drive'],
        'Kick drive',
        [0, 1, 0.01],
        undefined,
        'Soft-clips the punch, sub and knock together',
      ),
      num(
        ['drums', 'snare', 'drive'],
        'Snare drive',
        [0, 1, 0.01],
        undefined,
        'Soft-clips the snare before its room',
      ),
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
      num(['drums', 'snare', 'clapHz'], 'Clap pitch', [200, 8000, 10], 'Hz'),
      num(['drums', 'snare', 'clapDecay'], 'Clap decay', [0.01, 1, 0.005], 's'),
      num(['drums', 'snare', 'clapLevel'], 'Clap level', [-40, 12, 0.5], 'dB'),
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
      'A snap and a noise crunch over a saturated body and a sub thump on the root, scheduled on the next 1/16. Both pitches share the thump drop.',
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
      num(['impact', 'snapHz'], 'Snap high-pass', [500, 16000, 50], 'Hz'),
      num(['impact', 'snapDecay'], 'Snap decay', [0.002, 0.3, 0.001], 's'),
      num(['impact', 'snapLevel'], 'Snap level', [-40, 12, 0.5], 'dB'),
      {
        kind: 'choice',
        path: ['impact', 'bodyOctave'],
        label: 'Body octave',
        options: [0, 1, 2, 3],
      },
      num(['impact', 'bodyDecay'], 'Body decay', [0.01, 1, 0.005], 's'),
      num(['impact', 'bodySaturation'], 'Body saturation', [0, 1, 0.01]),
      num(['impact', 'bodyLevel'], 'Body level', [-40, 12, 0.5], 'dB'),
    ],
  },
  {
    id: 'blast',
    title: 'Crush blast',
    description:
      'A crushed shot bursting into area damage: a saturated boom onto the root under a low noise rush.',
    fields: [
      num(['blast', 'level'], 'Level', [-40, 6, 0.5], 'dB'),
      num(['blast', 'boomMultiple'], 'Boom pitch drop', [1, 16, 0.1], '×'),
      num(['blast', 'boomSeconds'], 'Boom drop time', [0.005, 1, 0.005], 's'),
      num(['blast', 'boomDecay'], 'Boom decay', [0.02, 3, 0.01], 's'),
      num(['blast', 'boomSaturation'], 'Boom saturation', [0, 1, 0.01]),
      num(['blast', 'boomLevel'], 'Boom level', [-40, 12, 0.5], 'dB'),
      num(['blast', 'noiseHz'], 'Rush filter', [100, 12000, 10], 'Hz'),
      num(['blast', 'noiseDecay'], 'Rush decay', [0.02, 3, 0.01], 's'),
      num(['blast', 'noiseLevel'], 'Rush level', [-40, 12, 0.5], 'dB'),
    ],
  },
  {
    id: 'menu',
    title: 'Loadout menu',
    description:
      "The track's bar looping under a low-pass while the loadout menu is open, and the weapon previews over it.",
    fields: [
      num(
        ['menu', 'level'],
        'Loop loudness',
        [-50, -6, 0.5],
        'dB',
        'RMS before the low-pass; previews sit at the weapon target over it',
      ),
      num(['menu', 'hz'], 'Loop filter', [100, 20000, 10], 'Hz'),
      num(['menu', 'resonance'], 'Loop resonance', [0.1, 12, 0.1]),
      num(['menu', 'fade'], 'Loop fade', [0, 2, 0.01], 's'),
      num(['menu', 'previewLevel'], 'Preview level', [-24, 12, 0.5], 'dB'),
    ],
  },
  {
    id: 'score',
    title: 'Score',
    description:
      'A pluck on every kill that climbs the scale with the combo - an octave by the top multiplier.',
    fields: [
      num(['score', 'level'], 'Level', [-40, 6, 0.5], 'dB'),
      {
        kind: 'choice',
        path: ['score', 'waveform'],
        label: 'Waveform',
        options: ['sine', 'triangle', 'square', 'sawtooth'],
      },
      num(['score', 'octave'], 'Octave', [2, 7, 1]),
      num(['score', 'decay'], 'Decay', [0.02, 2, 0.01], 's'),
      num(['score', 'brightnessHz'], 'Brightness', [200, 16000, 10], 'Hz'),
      num(['score', 'shimmerLevel'], 'Octave shimmer', [-40, 6, 0.5], 'dB'),
      num(
        ['score', 'echoBeats'],
        'Echo time',
        [0.125, 2, 0.125],
        undefined,
        'In beats; 0.75 is a dotted 1/8',
      ),
      num(['score', 'echoFeedback'], 'Echo feedback', [0, 0.9, 0.01]),
      num(['score', 'echoWet'], 'Echo mix', [0, 1, 0.01]),
    ],
  },
  {
    id: 'recharge',
    title: 'Beam recharge',
    description:
      'Replaces the reload fill for beams: a vent hissing down when it overheats, a whine rising through the recharge, a ping when it is back.',
    fields: [
      num(['recharge', 'level'], 'Level', [-40, 6, 0.5], 'dB'),
      num(['recharge', 'vent', 'fromHz'], 'Vent from', [200, 16000, 10], 'Hz'),
      num(['recharge', 'vent', 'toHz'], 'Vent to', [50, 8000, 10], 'Hz'),
      num(['recharge', 'vent', 'decay'], 'Vent decay', [0.02, 2, 0.01], 's'),
      num(['recharge', 'vent', 'level'], 'Vent level', [-40, 12, 0.5], 'dB'),
      num(['recharge', 'charge', 'fromHz'], 'Charge from', [40, 4000, 5], 'Hz'),
      num(['recharge', 'charge', 'toHz'], 'Charge to', [100, 8000, 10], 'Hz'),
      num(
        ['recharge', 'charge', 'level'],
        'Charge level',
        [-40, 12, 0.5],
        'dB',
      ),
      num(
        ['recharge', 'ready', 'decay'],
        'Ready ping decay',
        [0.01, 2, 0.01],
        's',
      ),
      num(
        ['recharge', 'ready', 'level'],
        'Ready ping level',
        [-40, 12, 0.5],
        'dB',
      ),
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
  {
    id: 'bed',
    title: 'Pad and air bed',
    description:
      'A detuned saw chord and high noise filling the space between drums and bass, pumped by the kick.',
    fields: [
      {
        kind: 'degrees',
        path: ['arrangement', 'pad', 'degrees'],
        label: 'Chord shape',
        hint: "Scale degrees above each chord's root, 0 is the root",
      },
      num(
        ['arrangement', 'pad', 'glide'],
        'Pad chord glide',
        [0, 2, 0.01],
        's',
      ),
      num(['arrangement', 'pad', 'octave'], 'Pad octave', [1, 6, 1]),
      num(['arrangement', 'pad', 'level'], 'Pad level', [-60, 6, 0.5], 'dB'),
      num(['arrangement', 'pad', 'hz'], 'Pad filter', [100, 12000, 10], 'Hz'),
      num(['arrangement', 'pad', 'detune'], 'Pad detune', [0, 100, 1], 'ct'),
      num(['arrangement', 'air', 'level'], 'Air level', [-60, 6, 0.5], 'dB'),
      num(
        ['arrangement', 'air', 'hz'],
        'Air high-pass',
        [1000, 18000, 50],
        'Hz',
      ),
      num(['arrangement', 'pad', 'calm'], 'Bed in calm', [-40, 12, 0.5], 'dB'),
      num(
        ['arrangement', 'pad', 'groove'],
        'Bed in groove',
        [-40, 12, 0.5],
        'dB',
      ),
      num(
        ['arrangement', 'pad', 'build'],
        'Bed in build',
        [-40, 12, 0.5],
        'dB',
      ),
      num(['arrangement', 'pad', 'drop'], 'Bed in drop', [-40, 12, 0.5], 'dB'),
    ],
  },
  {
    id: 'backing',
    title: 'Backing layers',
    description:
      'The arpeggio, lead hook and offbeat stabs over the chord progression, high-passed and ducked under the weapons.',
    fields: [
      num(['backing', 'level'], 'Level', [-40, 6, 0.5], 'dB'),
      num(['backing', 'highpassHz'], 'High-pass', [20, 2000, 10], 'Hz'),
      num(
        ['backing', 'duckDb'],
        'Duck on fire',
        [-30, 0, 0.5],
        'dB',
        'How far each shot pulls the layers down',
      ),
      num(['backing', 'duckSeconds'], 'Duck recovery', [0.02, 2, 0.01], 's'),
      {
        kind: 'choice',
        path: ['backing', 'arp', 'waveform'],
        label: 'Arp waveform',
        options: ['sine', 'triangle', 'square', 'sawtooth'],
      },
      num(['backing', 'arp', 'octave'], 'Arp octave', [2, 7, 1]),
      num(['backing', 'arp', 'level'], 'Arp level', [-40, 12, 0.5], 'dB'),
      num(['backing', 'arp', 'hz'], 'Arp filter', [100, 12000, 10], 'Hz'),
      num(
        ['backing', 'arp', 'peakHz'],
        'Arp pluck peak',
        [100, 16000, 10],
        'Hz',
      ),
      num(['backing', 'arp', 'decay'], 'Arp decay', [0.02, 1, 0.005], 's'),
      num(['backing', 'lead', 'octave'], 'Lead octave', [2, 7, 1]),
      num(['backing', 'lead', 'level'], 'Lead level', [-40, 12, 0.5], 'dB'),
      num(['backing', 'lead', 'hz'], 'Lead filter', [100, 16000, 10], 'Hz'),
      num(['backing', 'lead', 'detune'], 'Lead detune', [0, 100, 1], 'ct'),
      num(['backing', 'lead', 'glide'], 'Lead glide', [0, 0.5, 0.005], 's'),
      num(['backing', 'lead', 'decay'], 'Lead decay', [0.01, 2, 0.005], 's'),
      num(['backing', 'lead', 'sustain'], 'Lead sustain', [0, 1, 0.01]),
      num(
        ['backing', 'lead', 'release'],
        'Lead release',
        [0.01, 2, 0.005],
        's',
      ),
      num(['backing', 'lead', 'echoWet'], 'Lead echo', [0, 1, 0.01]),
      num(
        ['backing', 'lead', 'echoFeedback'],
        'Lead echo feedback',
        [0, 0.9, 0.01],
      ),
      {
        kind: 'choice',
        path: ['backing', 'stabs', 'waveform'],
        label: 'Stab waveform',
        options: ['sine', 'triangle', 'square', 'sawtooth'],
      },
      num(['backing', 'stabs', 'octave'], 'Stab octave', [2, 7, 1]),
      num(['backing', 'stabs', 'level'], 'Stab level', [-40, 12, 0.5], 'dB'),
      num(['backing', 'stabs', 'hz'], 'Stab filter', [100, 16000, 10], 'Hz'),
      num(['backing', 'stabs', 'decay'], 'Stab decay', [0.01, 1, 0.005], 's'),
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
