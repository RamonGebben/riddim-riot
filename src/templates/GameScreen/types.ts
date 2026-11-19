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

export type { Effect, Engine, Rate, WeaponFace } from '~/molecules/WeaponTag';
