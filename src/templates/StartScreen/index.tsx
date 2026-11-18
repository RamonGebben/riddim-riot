import { Button } from '~/atoms/Button';
import { Lead } from './components/Lead';
import { Meta } from './components/Meta';
import { Page } from './components/Page';
import { Title } from './components/Title';

export interface StartScreenProps {
  seed: number;
  bpm: number;
  /** Audio is starting up; the button waits for it. */
  isStarting: boolean;
  onStart: () => void;
}

export const StartScreen = ({
  seed,
  bpm,
  isStarting,
  onStart,
}: StartScreenProps) => {
  return (
    <Page>
      <Title>Bass Weapons</Title>
      <Lead>Your build is the song. Turn your sound on.</Lead>
      <Meta>
        seed {seed} · {bpm} BPM halftime
      </Meta>
      <Button onClick={onStart} disabled={isStarting}>
        Press to start
      </Button>
    </Page>
  );
};
