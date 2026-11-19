import { Icon } from '~/atoms/Icon';
import { BLAST_ICON, FX_ICONS, WEAPON_ICONS } from '~/game/icons';
import type { WeaponFace } from '../../types';
import { Tag } from './components/Tag';

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
