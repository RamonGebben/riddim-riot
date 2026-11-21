import { Icon } from '~/atoms/Icon';
import { BLAST_ICON, FX_ICONS, WEAPON_ICONS } from '~/game/icons';
import { Tag } from './components/Tag';

export type Engine = 'wobble' | 'laser' | 'beam';
export type Rate = '1/2' | '1/4' | '1/8' | '1/16';
export type Effect = 'distortion' | 'echo';

/** What a weapon is, as the screens name and draw it. */
export interface WeaponFace {
  name: string;
  oscillator: Engine;
  lfo: Rate;
  fx: Effect | null;
  /** A slow weapon whose shots burst. */
  blasts: boolean;
}

/** How a weapon's beat feels to fire. */
const RATES = {
  '1/2': 'Very slow, heavy hits',
  '1/4': 'Slow, heavy hits',
  '1/8': 'Steady fire',
  '1/16': 'Rapid spray',
} satisfies Record<Rate, string>;

/** What a weapon does, in words a first-timer can read. */
export const describeTraits = ({ oscillator, lfo, fx, blasts }: WeaponFace) =>
  [
    oscillator === 'beam' ? 'Hold for a steady beam' : RATES[lfo],
    blasts && 'shots explode',
    fx === 'distortion' && 'hits burst and push back',
    fx === 'echo' && 'every shot echoes',
  ]
    .filter(Boolean)
    .join(' · ');

const ENGINES = { wobble: 'Wobble', laser: 'Laser', beam: 'Beam' };
const EFFECTS = { distortion: 'Crush', echo: 'Echo' };

/** A weapon named by its icon, engine, beat and FX, inline in a sentence. */
export const WeaponTag = ({ oscillator, lfo, fx, blasts }: WeaponFace) => {
  return (
    <Tag>
      <Icon icon={WEAPON_ICONS[oscillator]} />
      {ENGINES[oscillator]} {lfo}
      {blasts && (
        <>
          <Icon icon={BLAST_ICON} />
          blast
        </>
      )}
      {fx && (
        <>
          <Icon icon={FX_ICONS[fx]} />
          {EFFECTS[fx]}
        </>
      )}
    </Tag>
  );
};
