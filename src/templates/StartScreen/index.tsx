import { Button } from '~/atoms/Button';
import { Lead } from './components/Lead';
import { Meta } from './components/Meta';
import { Page } from './components/Page';
import { Title } from './components/Title';

export type SessionStatus = 'idle' | 'starting' | 'playing';

export interface StartScreenProps {
  status: SessionStatus;
  seed: number;
  bpm: number;
  onStart: () => void;
  onStop: () => void;
}

export const StartScreen = ({
  status,
  seed,
  bpm,
  onStart,
  onStop,
}: StartScreenProps) => {
  const isPlaying = status === 'playing';

  return (
    <Page>
      <Title>Bass Weapons</Title>
      {!isPlaying && <Lead>Your build is the song. Turn your sound on.</Lead>}
      <Meta>
        seed {seed} · {bpm} BPM halftime
      </Meta>
      {isPlaying ? (
        <Button onClick={onStop}>Stop</Button>
      ) : (
        <Button onClick={onStart} disabled={status === 'starting'}>
          Press to start
        </Button>
      )}
    </Page>
  );
};
