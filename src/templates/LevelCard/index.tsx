import { Heading } from './components/Heading';
import { Meta } from './components/Meta';
import { Page } from './components/Page';

export interface LevelCardProps {
  level: number;
  levels: number;
  /** The next level's key, e.g. "G minor". */
  musicalKey: string;
}

/** Between levels, while the next one builds: where the run is going. */
export const LevelCard = ({ level, levels, musicalKey }: LevelCardProps) => {
  return (
    <Page role="status">
      <Meta>
        Level {level} of {levels}
      </Meta>
      <Heading>{level === levels ? 'Final level' : musicalKey}</Heading>
      <Meta>{level === levels ? musicalKey : 'Get ready'}</Meta>
    </Page>
  );
};
