import { Note } from '../Note';
import { Name } from './components/Name';

export interface WeaponCardProps {
  name: string;
  seed: number;
  /** What loudness normalization set its channel to, once it's armed. */
  gainDb: number | null;
}

export const WeaponCard = ({ name, seed, gainDb }: WeaponCardProps) => {
  return (
    <div>
      <Name>{name}</Name>
      <Note>
        seed {seed}
        {gainDb === null
          ? ''
          : ` · normalized ${gainDb > 0 ? '+' : ''}${gainDb.toFixed(1)} dB`}
      </Note>
    </div>
  );
};
