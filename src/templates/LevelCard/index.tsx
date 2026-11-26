import { Heading } from './components/Heading';
import { Meta } from './components/Meta';
import { Page } from './components/Page';

export interface LevelCardProps {
  level: number;
  levels: number;
  /** The next level's key, e.g. "G minor". */
  musicalKey: string;
  /** What its points are multiplied by: its tier. */
  multiplier?: number;
  /** Its subgenre and tempo, e.g. "Liquid", 172. */
  subgenre?: string;
  bpm?: number;
}

/** Between levels, while the next one builds: where the run is going. */
export const LevelCard = ({
  level,
  levels,
  musicalKey,
  multiplier = 1,
  subgenre,
  bpm,
}: LevelCardProps) => {
  return (
    <Page role="status">
      <Meta>
        Level {level} of {levels}
        {multiplier > 1 && ` · points ×${multiplier}`}
      </Meta>
      <Heading>{level === levels ? 'Final level' : musicalKey}</Heading>
      <Meta>{level === levels ? musicalKey : 'Get ready'}</Meta>
      {subgenre && (
        <Meta>
          {subgenre}
          {bpm !== undefined && ` · ${bpm} BPM`}
        </Meta>
      )}
    </Page>
  );
};
