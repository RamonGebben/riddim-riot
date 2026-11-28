import type { DesignPath } from '../schema';

/**
 * How the playground lays the sound design out as instrument panels: a rack
 * per instrument, each a few rows of sections the way a synth's front panel
 * groups them, every section a curve (when it has a shape worth seeing) and
 * the knobs that shape it. Every value of `DESIGN_SCHEMA` sits on exactly
 * one knob here - tests keep it that way.
 */

export type Engine = 'wobble' | 'laser' | 'beam';

/** A sound the playground can fire on its own (see the playground engine). */
export type Trigger =
  | 'impact'
  | 'score'
  | 'blast'
  | 'reload'
  | 'recharge'
  | 'chord'
  | 'riser'
  | 'drop';

/** A value of the rolled weapon, tweaked for this audition only. */
export type WeaponValue = 'cutoff' | 'resonance' | 'drive' | 'feedback' | 'wet';

export interface Knob {
  path: DesignPath;
  /** Short, read within its section: "Level" in the Sub section. */
  label: string;
}

/** The curve a section draws, from the design (and the weapon) it reads. */
export type CurveView =
  /** The engine's filter: the rolls' range as a band, the roll as a handle. */
  | { kind: 'filter'; engine: Engine }
  /** The LFO's sweep of the engine's filter over a bar. */
  | { kind: 'sweep'; engine: Engine }
  /** The growl's band-pass, swept from its floor to its peak. */
  | { kind: 'growl'; engine: 'wobble' | 'laser' }
  | { kind: 'envelope'; root: DesignPath }
  | { kind: 'drop'; multiple: DesignPath; seconds: DesignPath }
  | { kind: 'decay'; decay: DesignPath }
  /** A fixed filter: its cutoff (and focus) from the design. */
  | {
      kind: 'response';
      filter: 'lowpass' | 'highpass' | 'bandpass';
      hz: DesignPath;
      q?: DesignPath;
    }
  | { kind: 'pump' }
  /** The weapon's riff over a bar's sixteen steps. */
  | { kind: 'riff'; engine: Engine };

export interface Section {
  id: string;
  title: string;
  view?: CurveView;
  knobs: Array<Knob>;
  /** The rolled weapon's own values this section tweaks. */
  weapon?: Array<WeaponValue>;
  /** Fire the sound this section shapes. */
  trigger?: Trigger;
}

export interface Rack {
  id: string;
  label: string;
  /** Rows of sections, top to bottom, like a synth's panel. */
  rows: Array<Array<Section>>;
}

const knob = (path: DesignPath, label: string): Knob => ({ path, label });

const envelope = (root: DesignPath): Section => ({
  id: `${root.join('.')}`,
  title: 'Amp envelope',
  view: { kind: 'envelope', root },
  knobs: [
    knob([...root, 'attack'], 'Attack'),
    knob([...root, 'decay'], 'Decay'),
    knob([...root, 'sustain'], 'Sustain'),
    knob([...root, 'release'], 'Release'),
  ],
});

const filter = (engine: Engine, rolloff: DesignPath): Section => {
  const at = (...rest: DesignPath) => ['parts', 'engines', engine, ...rest];
  return {
    id: `${engine}.filter`,
    title: 'Filter',
    view: { kind: 'filter', engine },
    weapon: ['cutoff', 'resonance'],
    knobs: [
      knob(rolloff, 'Slope'),
      knob(at('cutoff', 0), 'Cut min'),
      knob(at('cutoff', 1), 'Cut max'),
      knob(at('resonance', 0), 'Reso min'),
      knob(at('resonance', 1), 'Reso max'),
    ],
  };
};

const riff = (engine: Engine): Section => ({
  id: `${engine}.riff`,
  title: 'Riff',
  view: { kind: 'riff', engine },
  knobs: [
    knob(['parts', 'engines', engine, 'degrees'], 'Degrees'),
    knob(['parts', 'engines', engine, 'octave'], 'Octave'),
  ],
});

/** The layers around a wobble or laser body, a row each. */
const layers = (engine: 'wobble' | 'laser'): Array<Array<Section>> => {
  const at = (...rest: DesignPath) => [engine, 'layers', ...rest];
  return [
    [
      {
        id: `${engine}.sub`,
        title: 'Sub',
        view: { kind: 'response', filter: 'highpass', hz: at('crossoverHz') },
        knobs: [
          knob(at('crossoverHz'), 'Crossover'),
          knob(at('sub', 'level'), 'Level'),
          knob(at('sub', 'octavesDown'), 'Oct down'),
          knob(at('sub', 'saturation'), 'Saturate'),
          knob(at('sub', 'release'), 'Release'),
        ],
      },
      {
        id: `${engine}.stack`,
        title: 'Stack',
        knobs: [
          knob(at('stack', 'level'), 'Level'),
          knob(at('stack', 'octave'), 'Octave'),
          knob(at('stack', 'detune'), 'Detune'),
        ],
      },
    ],
    [
      {
        id: `${engine}.growl`,
        title: 'Growl',
        view: { kind: 'growl', engine },
        knobs: [
          knob(at('growl', 'level'), 'Level'),
          knob(at('growl', 'octave'), 'Octave'),
          knob(at('growl', 'floorHz'), 'Floor'),
          knob(at('growl', 'peak'), 'Peak'),
          knob(at('growl', 'q'), 'Focus'),
          knob(at('growl', 'saturation'), 'Saturate'),
        ],
      },
      {
        id: `${engine}.click`,
        title: 'Click',
        view: { kind: 'decay', decay: at('click', 'decay') },
        knobs: [
          knob(at('click', 'level'), 'Level'),
          knob(at('click', 'hz'), 'Pitch'),
          knob(at('click', 'decay'), 'Decay'),
        ],
      },
    ],
  ];
};

const WOBBLE: Rack = {
  id: 'wobble',
  label: 'Wobble',
  rows: [
    [
      {
        id: 'wobble.osc',
        title: 'Osc',
        knobs: [
          knob(['wobble', 'voices'], 'Voices'),
          knob(['wobble', 'spread'], 'Spread'),
        ],
      },
      filter('wobble', ['wobble', 'rolloff']),
      {
        id: 'wobble.lfo',
        title: 'LFO',
        view: { kind: 'sweep', engine: 'wobble' },
        knobs: [
          knob(['wobble', 'sweepFloor'], 'Floor'),
          knob(['wobble', 'phase'], 'Phase'),
        ],
      },
      envelope(['wobble', 'envelope']),
    ],
    ...layers('wobble'),
    [riff('wobble')],
  ],
};

const LASER: Rack = {
  id: 'laser',
  label: 'Laser',
  rows: [
    [
      {
        id: 'laser.pew',
        title: 'Pitch drop',
        view: {
          kind: 'drop',
          multiple: ['laser', 'pitchDrop'],
          seconds: ['laser', 'pitchDropSeconds'],
        },
        knobs: [
          knob(['laser', 'pitchDrop'], 'Drop'),
          knob(['laser', 'pitchDropSeconds'], 'Time'),
        ],
      },
      filter('laser', ['laser', 'rolloff']),
      {
        id: 'laser.lfo',
        title: 'Shimmer',
        view: { kind: 'sweep', engine: 'laser' },
        knobs: [knob(['laser', 'shimmerDepth'], 'Low end')],
      },
      envelope(['laser', 'envelope']),
    ],
    ...layers('laser'),
    [riff('laser')],
  ],
};

const BEAM: Rack = {
  id: 'beam',
  label: 'Beam',
  rows: [
    [
      {
        id: 'beam.osc',
        title: 'Osc',
        knobs: [
          knob(['beam', 'voices'], 'Voices'),
          knob(['beam', 'spread'], 'Spread'),
          knob(['beam', 'glideSeconds'], 'Glide'),
          knob(['beam', 'topLevel'], 'Oct-up sq'),
        ],
      },
      filter('beam', ['beam', 'rolloff']),
      {
        id: 'beam.lfo',
        title: 'Pulse',
        view: { kind: 'sweep', engine: 'beam' },
        knobs: [knob(['beam', 'sweepFloor'], 'Floor')],
      },
      envelope(['beam', 'envelope']),
    ],
    [
      {
        id: 'beam.sub',
        title: 'Sub',
        knobs: [
          knob(['beam', 'sub', 'level'], 'Level'),
          knob(['beam', 'sub', 'octavesDown'], 'Oct down'),
          knob(['beam', 'sub', 'saturation'], 'Saturate'),
        ],
      },
      {
        id: 'beam.sizzle',
        title: 'Sizzle',
        view: {
          kind: 'response',
          filter: 'highpass',
          hz: ['beam', 'sizzle', 'hz'],
        },
        knobs: [
          knob(['beam', 'sizzle', 'level'], 'Level'),
          knob(['beam', 'sizzle', 'hz'], 'High-pass'),
        ],
      },
    ],
    [riff('beam')],
  ],
};

const DRUMS: Rack = {
  id: 'drums',
  label: 'Drums',
  rows: [
    [
      {
        id: 'drums.kick',
        title: 'Kick',
        view: {
          kind: 'drop',
          multiple: ['drums', 'kick', 'pitchMultiple'],
          seconds: ['drums', 'kick', 'pitchSeconds'],
        },
        knobs: [
          knob(['drums', 'kick', 'level'], 'Level'),
          knob(['drums', 'kick', 'pitchMultiple'], 'Drop'),
          knob(['drums', 'kick', 'pitchSeconds'], 'Drop time'),
          knob(['drums', 'kick', 'decay'], 'Decay'),
          knob(['drums', 'kick', 'drive'], 'Drive'),
        ],
      },
      {
        id: 'drums.kickLayers',
        title: 'Kick layers',
        view: { kind: 'decay', decay: ['drums', 'kick', 'subDecay'] },
        knobs: [
          knob(['drums', 'kick', 'clickHz'], 'Click Hz'),
          knob(['drums', 'kick', 'clickDecay'], 'Click dec'),
          knob(['drums', 'kick', 'clickLevel'], 'Click lvl'),
          knob(['drums', 'kick', 'subDecay'], 'Sub tail'),
          knob(['drums', 'kick', 'subLevel'], 'Sub lvl'),
          knob(['drums', 'kick', 'knockDecay'], 'Knock dec'),
          knob(['drums', 'kick', 'knockLevel'], 'Knock lvl'),
        ],
      },
    ],
    [
      {
        id: 'drums.snare',
        title: 'Snare',
        view: {
          kind: 'response',
          filter: 'highpass',
          hz: ['drums', 'snare', 'noiseHz'],
        },
        knobs: [
          knob(['drums', 'snare', 'noiseHz'], 'Noise HP'),
          knob(['drums', 'snare', 'noiseDecay'], 'Noise dec'),
          knob(['drums', 'snare', 'noiseLevel'], 'Noise lvl'),
          knob(['drums', 'snare', 'bodyHz'], 'Body Hz'),
          knob(['drums', 'snare', 'bodyDecay'], 'Body dec'),
          knob(['drums', 'snare', 'bodyLevel'], 'Body lvl'),
          knob(['drums', 'snare', 'drive'], 'Drive'),
        ],
      },
      {
        id: 'drums.clap',
        title: 'Clap + room',
        view: {
          kind: 'response',
          filter: 'bandpass',
          hz: ['drums', 'snare', 'clapHz'],
        },
        knobs: [
          knob(['drums', 'snare', 'clapHz'], 'Clap Hz'),
          knob(['drums', 'snare', 'clapDecay'], 'Clap dec'),
          knob(['drums', 'snare', 'clapLevel'], 'Clap lvl'),
          knob(['drums', 'snare', 'roomDecay'], 'Room'),
          knob(['drums', 'snare', 'roomWet'], 'Room mix'),
        ],
      },
    ],
    [
      {
        id: 'drums.hats',
        title: 'Hats',
        view: {
          kind: 'response',
          filter: 'highpass',
          hz: ['drums', 'hat', 'hz'],
        },
        knobs: [
          knob(['drums', 'hat', 'hz'], 'Cls HP'),
          knob(['drums', 'hat', 'decay'], 'Cls dec'),
          knob(['drums', 'hat', 'level'], 'Cls lvl'),
          knob(['drums', 'openHat', 'hz'], 'Open HP'),
          knob(['drums', 'openHat', 'decay'], 'Open dec'),
          knob(['drums', 'openHat', 'level'], 'Open lvl'),
        ],
      },
      {
        id: 'drums.kit',
        title: 'Kit bus',
        knobs: [
          knob(['drums', 'level'], 'Level'),
          knob(['drums', 'drive'], 'Drive'),
          knob(['drums', 'glueThreshold'], 'Glue thr'),
          knob(['drums', 'glueRatio'], 'Ratio'),
        ],
      },
      {
        id: 'mix.pump',
        title: 'Sidechain',
        view: { kind: 'pump' },
        knobs: [
          knob(['mix', 'bedPumpDb'], 'Bed duck'),
          knob(['mix', 'weaponPumpDb'], 'Wpn duck'),
          knob(['mix', 'pumpSeconds'], 'Swell'),
        ],
      },
    ],
  ],
};

const HITS: Rack = {
  id: 'hits',
  label: 'Hits',
  rows: [
    [
      {
        id: 'impact.crunch',
        title: 'Impact crunch',
        trigger: 'impact',
        view: {
          kind: 'response',
          filter: 'bandpass',
          hz: ['impact', 'crunchHz'],
          q: ['impact', 'crunchQ'],
        },
        knobs: [
          knob(['impact', 'level'], 'Level'),
          knob(['impact', 'crunchHz'], 'Pitch'),
          knob(['impact', 'crunchQ'], 'Focus'),
          knob(['impact', 'crunchDecay'], 'Decay'),
          knob(['impact', 'crunchLevel'], 'Crunch'),
        ],
      },
      {
        id: 'impact.thump',
        title: 'Impact thump',
        trigger: 'impact',
        view: {
          kind: 'drop',
          multiple: ['impact', 'thumpMultiple'],
          seconds: ['impact', 'thumpSeconds'],
        },
        knobs: [
          knob(['impact', 'thumpMultiple'], 'Drop'),
          knob(['impact', 'thumpSeconds'], 'Drop time'),
          knob(['impact', 'thumpDecay'], 'Decay'),
          knob(['impact', 'thumpLevel'], 'Level'),
        ],
      },
      {
        id: 'impact.snap',
        title: 'Impact snap + body',
        trigger: 'impact',
        view: { kind: 'decay', decay: ['impact', 'bodyDecay'] },
        knobs: [
          knob(['impact', 'snapHz'], 'Snap HP'),
          knob(['impact', 'snapDecay'], 'Snap dec'),
          knob(['impact', 'snapLevel'], 'Snap lvl'),
          knob(['impact', 'bodyOctave'], 'Body oct'),
          knob(['impact', 'bodyDecay'], 'Body dec'),
          knob(['impact', 'bodySaturation'], 'Body sat'),
          knob(['impact', 'bodyLevel'], 'Body lvl'),
        ],
      },
    ],
    [
      {
        id: 'blast',
        title: 'Crush blast',
        trigger: 'blast',
        view: {
          kind: 'drop',
          multiple: ['blast', 'boomMultiple'],
          seconds: ['blast', 'boomSeconds'],
        },
        knobs: [
          knob(['blast', 'level'], 'Level'),
          knob(['blast', 'boomMultiple'], 'Drop'),
          knob(['blast', 'boomSeconds'], 'Drop time'),
          knob(['blast', 'boomDecay'], 'Boom dec'),
          knob(['blast', 'boomSaturation'], 'Boom sat'),
          knob(['blast', 'boomLevel'], 'Boom lvl'),
          knob(['blast', 'noiseHz'], 'Rush Hz'),
          knob(['blast', 'noiseDecay'], 'Rush dec'),
          knob(['blast', 'noiseLevel'], 'Rush lvl'),
        ],
      },
      {
        id: 'score',
        title: 'Score',
        trigger: 'score',
        view: { kind: 'decay', decay: ['score', 'decay'] },
        knobs: [
          knob(['score', 'level'], 'Level'),
          knob(['score', 'waveform'], 'Wave'),
          knob(['score', 'octave'], 'Octave'),
          knob(['score', 'decay'], 'Decay'),
          knob(['score', 'brightnessHz'], 'Bright'),
          knob(['score', 'shimmerLevel'], 'Shimmer'),
          knob(['score', 'echoBeats'], 'Echo time'),
          knob(['score', 'echoFeedback'], 'Echo fb'),
          knob(['score', 'echoWet'], 'Echo mix'),
        ],
      },
    ],
    [
      {
        id: 'chord',
        title: 'Chord powerup',
        trigger: 'chord',
        view: { kind: 'decay', decay: ['chord', 'decay'] },
        knobs: [
          knob(['chord', 'level'], 'Level'),
          knob(['chord', 'waveform'], 'Wave'),
          knob(['chord', 'octave'], 'Octave'),
          knob(['chord', 'decay'], 'Decay'),
          knob(['chord', 'brightnessHz'], 'Bright'),
        ],
      },
      {
        id: 'reload',
        title: 'Reload',
        trigger: 'reload',
        knobs: [
          knob(['reload', 'level'], 'Level'),
          knob(['reload', 'clickHz'], 'Click Hz'),
          knob(['reload', 'clickLevel'], 'Click lvl'),
          knob(['reload', 'rumbleFrom'], 'Rmbl lo'),
          knob(['reload', 'rumbleTo'], 'Rmbl hi'),
          knob(['reload', 'rumbleLevel'], 'Rmbl lvl'),
        ],
      },
      {
        id: 'recharge',
        title: 'Beam recharge',
        trigger: 'recharge',
        knobs: [
          knob(['recharge', 'level'], 'Level'),
          knob(['recharge', 'vent', 'fromHz'], 'Vent from'),
          knob(['recharge', 'vent', 'toHz'], 'Vent to'),
          knob(['recharge', 'vent', 'decay'], 'Vent dec'),
          knob(['recharge', 'vent', 'level'], 'Vent lvl'),
          knob(['recharge', 'charge', 'fromHz'], 'Chg from'),
          knob(['recharge', 'charge', 'toHz'], 'Chg to'),
          knob(['recharge', 'charge', 'level'], 'Chg lvl'),
          knob(['recharge', 'ready', 'decay'], 'Ping dec'),
          knob(['recharge', 'ready', 'level'], 'Ping lvl'),
        ],
      },
    ],
  ],
};

const TRACK: Rack = {
  id: 'track',
  label: 'Track',
  rows: [
    [
      {
        id: 'arrangement.riser',
        title: 'Riser',
        trigger: 'riser',
        knobs: [
          knob(['arrangement', 'level'], 'FX level'),
          knob(['arrangement', 'riserFrom'], 'From'),
          knob(['arrangement', 'riserTo'], 'To'),
          knob(['arrangement', 'riserLevel'], 'Level'),
          knob(['arrangement', 'riserAttack'], 'Attack'),
        ],
      },
      {
        id: 'arrangement.drop',
        title: 'Drop hit',
        trigger: 'drop',
        view: { kind: 'decay', decay: ['arrangement', 'crashDecay'] },
        knobs: [
          knob(['arrangement', 'crashHz'], 'Crash HP'),
          knob(['arrangement', 'crashDecay'], 'Crash dec'),
          knob(['arrangement', 'crashLevel'], 'Crash lvl'),
          knob(['arrangement', 'boomDecay'], 'Boom dec'),
          knob(['arrangement', 'boomLevel'], 'Boom lvl'),
        ],
      },
      {
        id: 'arrangement.sections',
        title: 'Section filter',
        view: {
          kind: 'response',
          filter: 'lowpass',
          hz: ['arrangement', 'calmHz'],
        },
        knobs: [
          knob(['arrangement', 'calmHz'], 'Calm'),
          knob(['arrangement', 'grooveHz'], 'Groove'),
        ],
      },
    ],
    [
      {
        id: 'bed.pad',
        title: 'Pad',
        view: {
          kind: 'response',
          filter: 'lowpass',
          hz: ['arrangement', 'pad', 'hz'],
        },
        knobs: [
          knob(['arrangement', 'pad', 'degrees'], 'Chord'),
          knob(['arrangement', 'pad', 'glide'], 'Glide'),
          knob(['arrangement', 'pad', 'octave'], 'Octave'),
          knob(['arrangement', 'pad', 'level'], 'Level'),
          knob(['arrangement', 'pad', 'hz'], 'Filter'),
          knob(['arrangement', 'pad', 'detune'], 'Detune'),
        ],
      },
      {
        id: 'bed.sections',
        title: 'Bed per section',
        knobs: [
          knob(['arrangement', 'pad', 'calm'], 'Calm'),
          knob(['arrangement', 'pad', 'groove'], 'Groove'),
          knob(['arrangement', 'pad', 'build'], 'Build'),
          knob(['arrangement', 'pad', 'drop'], 'Drop'),
          knob(['arrangement', 'air', 'level'], 'Air lvl'),
          knob(['arrangement', 'air', 'hz'], 'Air HP'),
        ],
      },
    ],
    [
      {
        id: 'backing.bus',
        title: 'Backing bus',
        view: {
          kind: 'response',
          filter: 'highpass',
          hz: ['backing', 'highpassHz'],
        },
        knobs: [
          knob(['backing', 'level'], 'Level'),
          knob(['backing', 'highpassHz'], 'High-pass'),
          knob(['backing', 'duckDb'], 'Duck'),
          knob(['backing', 'duckSeconds'], 'Recover'),
        ],
      },
      {
        id: 'backing.arp',
        title: 'Arp',
        view: { kind: 'decay', decay: ['backing', 'arp', 'decay'] },
        knobs: [
          knob(['backing', 'arp', 'waveform'], 'Wave'),
          knob(['backing', 'arp', 'octave'], 'Octave'),
          knob(['backing', 'arp', 'level'], 'Level'),
          knob(['backing', 'arp', 'hz'], 'Filter'),
          knob(['backing', 'arp', 'peakHz'], 'Peak'),
          knob(['backing', 'arp', 'decay'], 'Decay'),
        ],
      },
      {
        id: 'backing.stabs',
        title: 'Stabs',
        knobs: [
          knob(['backing', 'stabs', 'waveform'], 'Wave'),
          knob(['backing', 'stabs', 'octave'], 'Octave'),
          knob(['backing', 'stabs', 'level'], 'Level'),
          knob(['backing', 'stabs', 'hz'], 'Filter'),
          knob(['backing', 'stabs', 'decay'], 'Decay'),
        ],
      },
    ],
    [
      {
        id: 'backing.lead',
        title: 'Lead',
        view: {
          kind: 'envelope',
          root: ['backing', 'lead'],
        },
        knobs: [
          knob(['backing', 'lead', 'octave'], 'Octave'),
          knob(['backing', 'lead', 'level'], 'Level'),
          knob(['backing', 'lead', 'hz'], 'Filter'),
          knob(['backing', 'lead', 'detune'], 'Detune'),
          knob(['backing', 'lead', 'glide'], 'Glide'),
          knob(['backing', 'lead', 'decay'], 'Decay'),
          knob(['backing', 'lead', 'sustain'], 'Sustain'),
          knob(['backing', 'lead', 'release'], 'Release'),
          knob(['backing', 'lead', 'echoWet'], 'Echo'),
          knob(['backing', 'lead', 'echoFeedback'], 'Echo fb'),
        ],
      },
      {
        id: 'menu',
        title: 'Loadout menu',
        view: {
          kind: 'response',
          filter: 'lowpass',
          hz: ['menu', 'hz'],
          q: ['menu', 'resonance'],
        },
        knobs: [
          knob(['menu', 'level'], 'Ceiling'),
          knob(['menu', 'hz'], 'Filter'),
          knob(['menu', 'resonance'], 'Reso'),
          knob(['menu', 'fade'], 'Fade'),
          knob(['menu', 'previewLevel'], 'Preview'),
          knob(['menu', 'seam'], 'Seam'),
          knob(['menu', 'ahead'], 'Headroom'),
        ],
      },
    ],
  ],
};

export const RACKS: Array<Rack> = [WOBBLE, LASER, BEAM, DRUMS, HITS, TRACK];

/**
 * The output strip, beside every rack: what every weapon shares - the
 * makers' oscillators, the FX the rolls land in and the weapon mix.
 */
export const OUTPUT: Array<Section> = [
  {
    id: 'makers',
    title: 'Makers',
    weapon: ['drive'],
    knobs: [
      knob(['parts', 'manufacturers', 'vandal', 'waveform'], 'Vandal'),
      knob(['parts', 'manufacturers', 'vandal', 'drive'], 'Vdl drive'),
      knob(['parts', 'manufacturers', 'lumen', 'waveform'], 'Lumen'),
      knob(['parts', 'manufacturers', 'lumen', 'drive'], 'Lmn drive'),
    ],
  },
  {
    id: 'fx',
    title: 'FX rolls',
    weapon: ['feedback', 'wet'],
    knobs: [
      knob(['parts', 'crush', 'drive', 0], 'Crush lo'),
      knob(['parts', 'crush', 'drive', 1], 'Crush hi'),
      knob(['parts', 'echo', 'feedback', 0], 'Fb lo'),
      knob(['parts', 'echo', 'feedback', 1], 'Fb hi'),
      knob(['parts', 'echo', 'wet', 0], 'Wet lo'),
      knob(['parts', 'echo', 'wet', 1], 'Wet hi'),
    ],
  },
  {
    id: 'weaponMix',
    title: 'Weapon mix',
    knobs: [
      knob(['weaponMix', 'targetDb'], 'Target'),
      knob(['weaponMix', 'articulation'], 'Artic'),
      knob(['weaponMix', 'driveWet'], 'Drive mix'),
      knob(['weaponMix', 'glueThreshold'], 'Glue thr'),
      knob(['weaponMix', 'glueRatio'], 'Ratio'),
      knob(['weaponMix', 'subCutHz'], 'Sub cut'),
      knob(['weaponMix', 'holsterFadeSeconds'], 'Switch'),
    ],
  },
];

/** Every section the playground shows, racks and output strip alike. */
export const allSections = (): Array<Section> => [
  ...RACKS.flatMap(rack => rack.rows.flat()),
  ...OUTPUT,
];
