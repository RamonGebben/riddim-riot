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
}

/** Between levels, while the next one builds: where the run is going. */
export const LevelCard = ({
  level,
  levels,
  musicalKey,
  multiplier = 1,
}: LevelCardProps) => {
  return (
    <Page role="status">
      <Meta>
        Level {level} of {levels}
        {multiplier > 1 && ` · points ×${multiplier}`}
      </Meta>
      <Heading>{level === levels ? 'Final level' : musicalKey}</Heading>
      <Meta>{level === levels ? musicalKey : 'Get ready'}</Meta>
    </Page>
  );
};
