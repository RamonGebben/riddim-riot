import { mergeDesign, type SoundDesign } from './model';
import saved from './design.json';

export * from './model';

/** What the game plays: the base with the saved playground design over it. */
export const SOUND_DESIGN: SoundDesign = mergeDesign(saved);
