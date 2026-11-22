import type { ReactNode } from 'react';
import { Button } from '~/atoms/Button';
import { PointerOnly } from '../PointerOnly';
import { Actions } from './components/Actions';
import { Body } from './components/Body';
import { Card } from './components/Card';
import { Header } from './components/Header';
import { Steps } from './components/Steps';

interface Step {
  heading: string;
  mouse: ReactNode;
  touch: ReactNode;
}

/** The controls a step at a time, closing on the circle that starts it all. */
export const TUTORIAL_STEPS: Array<Step> = [
  {
    heading: 'Move',
    mouse: (
      <>
        <kbd>WASD</kbd> or the arrow keys move you round the arena.
      </>
    ),
    touch: (
      <>
        Your <kbd>left thumb</kbd> aims; push it further to move.
      </>
    ),
  },
  {
    heading: 'Aim and fire',
    mouse: (
      <>
        The <kbd>mouse</kbd> aims; click or hold to fire. Shots snap to the
        beat, and a press right on it hits harder.
      </>
    ),
    touch: (
      <>
        Tap or hold your <kbd>right thumb</kbd> to fire. Shots snap to the beat,
        and a tap right on it hits harder.
      </>
    ),
  },
  {
    heading: 'Dash',
    mouse: (
      <>
        <kbd>Space</kbd> dashes the way you&apos;re moving, to get out of
        trouble. It&apos;s back two beats later.
      </>
    ),
    touch: (
      <>
        The round <kbd>Dash</kbd> button, bottom right, dashes the way
        you&apos;re moving. It&apos;s back two beats later.
      </>
    ),
  },
  {
    heading: 'Switch weapons',
    mouse: (
      <>
        <kbd>1</kbd>–<kbd>3</kbd>, <kbd>Q</kbd>/<kbd>E</kbd> or the wheel switch
        between your three weapons. Each fires to its own rhythm and reloads
        when it runs dry.
      </>
    ),
    touch: (
      <>
        Hold a weapon on the <kbd>right edge</kbd> to switch to it and fire it.
        Each fires to its own rhythm and reloads when it runs dry.
      </>
    ),
  },
  {
    heading: 'Loot and your bag',
    mouse: (
      <>
        Enemies drop weapons that drift into your bag. <kbd>Tab</kbd> or{' '}
        <kbd>B</kbd> opens your loadout to swap them in; the game waits.
      </>
    ),
    touch: (
      <>
        Enemies drop weapons that drift into your bag. The <kbd>bag</kbd>{' '}
        button, top right, opens your loadout to swap them in; the game waits.
      </>
    ),
  },
  {
    heading: 'Health and pause',
    mouse: (
      <>
        Hearts top left are your health; hearts enemies drop heal you.{' '}
        <kbd>Esc</kbd> or <kbd>P</kbd> pauses.
      </>
    ),
    touch: (
      <>
        Hearts top left are your health; hearts enemies drop heal you. The{' '}
        <kbd>pause</kbd> button sits top right.
      </>
    ),
  },
  {
    heading: 'Ready',
    mouse: 'Now step into the circle to start your run.',
    touch: 'Now step into the circle to start your run.',
  },
];

export interface TutorialProps {
  /** Which step is showing, from 0. */
  step: number;
  onStep: (step: number) => void;
  /** Skipped, or read to the end: don't show it again. */
  onDone: () => void;
  /** Kept mounted under a pause or the menu, so the step isn't lost. */
  hidden?: boolean;
}

/**
 * The controls, a step at a time, on the first level until the player has
 * been through them once. The game runs behind it, so each control can be
 * tried as it's read, and stepping into the circle starts the run anyway.
 */
export const Tutorial = ({
  step,
  onStep,
  onDone,
  hidden = false,
}: TutorialProps) => {
  const { heading, mouse, touch } = TUTORIAL_STEPS[step];
  const last = step === TUTORIAL_STEPS.length - 1;
  return (
    <Card aria-labelledby="tutorial-heading" hidden={hidden}>
      <Header>
        <h2 id="tutorial-heading">{heading}</h2>
        <Steps>
          {step + 1}/{TUTORIAL_STEPS.length}
        </Steps>
      </Header>
      <Body>
        <PointerOnly $pointer="mouse">{mouse}</PointerOnly>
        <PointerOnly $pointer="touch">{touch}</PointerOnly>
      </Body>
      <Actions>
        {!last && (
          <Button type="button" $variant="secondary" onClick={onDone}>
            Skip
          </Button>
        )}
        {step > 0 && (
          <Button
            type="button"
            $variant="secondary"
            onClick={() => onStep(step - 1)}
          >
            Back
          </Button>
        )}
        <Button type="button" onClick={last ? onDone : () => onStep(step + 1)}>
          {last ? 'Got it' : 'Next'}
        </Button>
      </Actions>
    </Card>
  );
};
