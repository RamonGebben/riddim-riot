import { Button } from '~/atoms/Button';
import { Lead } from './components/Lead';
import { Meta } from './components/Meta';
import { Page } from './components/Page';
import { Status } from './components/Status';
import { Title } from './components/Title';

export interface StartScreenProps {
  seed: number;
  /** The level's key, e.g. "F minor". */
  musicalKey: string;
  bpm: number;
  /** Audio is starting up; the button waits for it. */
  isStarting: boolean;
  /** Where starting has got to, shown while it runs. */
  step: StartStep | null;
  /** Why the last start failed. */
  error: string | null;
  onStart: () => void;
}

export type StartStep = 'audio' | 'kit' | 'weapons';

const STEP_LABELS = {
  audio: 'Starting audio…',
  kit: 'Building the drum kit…',
  weapons: 'Measuring your weapons…',
} satisfies Record<StartStep, string>;

export const StartScreen = ({
  seed,
  musicalKey,
  bpm,
  isStarting,
  step,
  error,
  onStart,
}: StartScreenProps) => {
  return (
    <Page>
      <Title>Bass Weapons</Title>
      <Lead>Your build is the song. Turn your sound on.</Lead>
      <Meta>
        seed {seed} · {musicalKey} · {bpm} BPM halftime
      </Meta>
      <Button onClick={onStart} disabled={isStarting}>
        Press to start
      </Button>
      {isStarting && step && <Status role="status">{STEP_LABELS[step]}</Status>}
      {error && (
        <Status role="alert" $error>
          Couldn't start: {error}
        </Status>
      )}
    </Page>
  );
};
