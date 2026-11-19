/** Where a level is, from waiting at the circle to its exit open. */
export type LevelPhase = 'waiting' | 'charging' | 'song' | 'clear';

export type SongPart =
  | 'intro'
  | 'breakdown'
  | 'buildup'
  | 'drop1'
  | 'drop2'
  | 'bridge'
  | 'drop3'
  | 'outro';

export type Engine = 'wobble' | 'laser' | 'beam';
export type Rate = '1/2' | '1/4' | '1/8' | '1/16';
export type Effect = 'distortion' | 'echo';

/** What a weapon is, as the HUD names and draws it. */
export interface WeaponFace {
  name: string;
  oscillator: Engine;
  lfo: Rate;
  fx: Effect | null;
  /** A slow weapon whose shots burst. */
  blasts: boolean;
}
