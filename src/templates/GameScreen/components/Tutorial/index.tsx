import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { PointerOnly } from '../PointerOnly';
import { Body } from './components/Body';
import { Card } from './components/Card';
import { Header } from './components/Header';
import { PowerupLegend } from './components/PowerupLegend';
import { Steps } from './components/Steps';

/** What the player is doing, as far as the walkthrough needs to see it. */
export interface TutorialSignals {
  moving: boolean;
  /** Changes with every dash. */
  dashKey: number;
  /** The weapon in hand. */
  active: number;
  /** Its rounds left: a drop is a shot. */
  ammo: number;
  menuOpen: boolean;
  paused: boolean;
}

interface Step {
  heading: string;
  mouse: ReactNode;
  touch: ReactNode;
  /** Shown under the text, with a mouse and on a touch screen alike. */
  extra?: ReactNode;
  /** Done once the player does it, seen against the signals before. */
  done: (now: TutorialSignals, before: TutorialSignals) => boolean;
}

// The last card stays up until the circle takes, so it has time for the
// powerups too: there's nothing to do for those until one drops.
const READY =
  'Enemies now and then drop a powerup; walk over one and it runs for a few bars. Now step into the circle to start your run.';

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
    done: now => now.moving,
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
    // Not a swap in the menu or a switch, which change the rounds shown too.
    done: (now, before) =>
      !now.menuOpen &&
      !before.menuOpen &&
      now.active === before.active &&
      now.ammo < before.ammo,
  },
  {
    heading: 'Dash',
    mouse: (
      <>
        <kbd>Space</kbd> dashes the way you&apos;re moving, straight through
        enemies. It&apos;s back two beats later.
      </>
    ),
    touch: (
      <>
        The round <kbd>Dash</kbd> button, bottom right, dashes the way
        you&apos;re moving, straight through enemies.
      </>
    ),
    done: (now, before) => now.dashKey !== before.dashKey,
  },
  {
    heading: 'Switch weapons',
    mouse: (
      <>
        <kbd>1</kbd>–<kbd>3</kbd>, <kbd>Q</kbd>/<kbd>E</kbd> or the wheel switch
        between your three weapons. Each fires to its own rhythm.
      </>
    ),
    touch: (
      <>
        Hold a weapon on the <kbd>right edge</kbd> to switch to it and fire it.
        Each fires to its own rhythm.
      </>
    ),
    done: (now, before) => now.active !== before.active,
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
    done: now => now.menuOpen,
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
    done: now => now.paused,
  },
  {
    heading: 'Ready',
    mouse: READY,
    touch: READY,
    extra: <PowerupLegend />,
    // Stepping in starts the run, and the walkthrough goes with the circle.
    done: () => false,
  },
];

/** Long enough to see the tick before the next step comes up. */
const DONE_MS = 700;

export interface TutorialProps {
  signals: TutorialSignals;
  /** Kept mounted under a pause or the menu, so it sees them happen. */
  hidden?: boolean;
}

/**
 * The controls, a step at a time, on a first run while the circle waits.
 * Nothing to press: each step ticks off when the player does what it says
 * and the next comes up. The game runs behind it, and stepping into the
 * circle starts the run whatever step it's on.
 */
export const Tutorial = ({ signals, hidden = false }: TutorialProps) => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const before = useRef(signals);
  const headingId = useId();

  useEffect(() => {
    const previous = before.current;
    before.current = signals;
    if (done || !TUTORIAL_STEPS[step].done(signals, previous)) return;
    setDone(true);
  }, [signals, step, done]);

  // A UI beat, not a musical one: the tick shows, then the next step.
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => {
      setStep(current => current + 1);
      setDone(false);
    }, DONE_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  const { heading, mouse, touch, extra } = TUTORIAL_STEPS[step];
  return (
    <Card
      aria-labelledby={headingId}
      aria-live="polite"
      hidden={hidden}
      $done={done}
    >
      <Header>
        <h2 id={headingId}>{heading}</h2>
        <Steps $done={done}>
          {done ? (
            <span role="img" aria-label="Done">
              ✓
            </span>
          ) : (
            `${step + 1}/${TUTORIAL_STEPS.length}`
          )}
        </Steps>
      </Header>
      <Body>
        <PointerOnly $pointer="mouse">{mouse}</PointerOnly>
        <PointerOnly $pointer="touch">{touch}</PointerOnly>
      </Body>
      {extra}
    </Card>
  );
};
