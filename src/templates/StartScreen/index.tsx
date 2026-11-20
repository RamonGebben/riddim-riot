import { useEffect, type Ref } from 'react';
import { Button } from '~/atoms/Button';
import { Icon } from '~/atoms/Icon';
import { Toggle } from '~/atoms/Toggle';
import { WEAPON_ICONS } from '~/game/icons';
import type { WeaponFace } from '~/molecules/WeaponTag';
import { Backdrop } from './components/Backdrop';
import { Briefing } from './components/Briefing';
import { Controls } from './components/Controls';
import { Group } from './components/Group';
import { Hero } from './components/Hero';
import { Key } from './components/Key';
import { Lead } from './components/Lead';
import { Meta } from './components/Meta';
import { Options } from './components/Options';
import { Page } from './components/Page';
import { Shade } from './components/Shade';
import { Shortcut } from './components/Shortcut';
import { StartRow } from './components/StartRow';
import { Status } from './components/Status';
import { Title } from './components/Title';
import { Traits } from './components/Traits';
import { Weapon } from './components/Weapon';
import { WeaponList } from './components/WeaponList';

export interface StartScreenProps {
  /** The first level's key, e.g. "F minor". */
  musicalKey: string;
  bpm: number;
  /** Levels in a run. */
  levels: number;
  /** The best score on this device; 0 hides it. */
  best: number;
  /** The weapons the run opens with. */
  weapons: Array<WeaponFace>;
  /** Shake and flashes turned down, in the game and behind this page. */
  flashingReduced: boolean;
  /** Audio is starting up; the button waits for it. */
  isStarting: boolean;
  /** Where starting has got to, shown while it runs. */
  step: StartStep | null;
  /** Why the last start failed. */
  error: string | null;
  /** Where the live level is drawn behind the page. */
  backdropRef?: Ref<HTMLDivElement>;
  onStart: () => void;
  onFlashingReduced: (reduced: boolean) => void;
}

export type StartStep = 'audio' | 'kit' | 'weapons';

const STEP_LABELS = {
  audio: 'Starting audio…',
  kit: 'Building the drum kit…',
  weapons: 'Measuring your weapons…',
} satisfies Record<StartStep, string>;

/** How a weapon's beat feels to fire. */
const RATES = {
  '1/2': 'Very slow, heavy hits',
  '1/4': 'Slow, heavy hits',
  '1/8': 'Steady fire',
  '1/16': 'Rapid spray',
} satisfies Record<WeaponFace['lfo'], string>;

/** What a weapon does, in words a first-timer can read. */
export const describeTraits = ({ oscillator, lfo, fx, blasts }: WeaponFace) =>
  [
    oscillator === 'beam' ? 'Hold for a steady beam' : RATES[lfo],
    blasts && 'shots explode',
    fx === 'distortion' && 'hits burst and push back',
    fx === 'echo' && 'every shot echoes',
  ]
    .filter(Boolean)
    .join(' · ');

export const StartScreen = ({
  musicalKey,
  bpm,
  levels,
  best,
  weapons,
  flashingReduced,
  isStarting,
  step,
  error,
  backdropRef,
  onStart,
  onFlashingReduced,
}: StartScreenProps) => {
  const start = () => {
    if (!isStarting) onStart();
  };

  // Enter starts from anywhere on the page. A focused control answers
  // Enter itself: a button presses, the switch flips.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      const { target } = event;
      if (target instanceof HTMLButtonElement) return;
      if (target instanceof HTMLInputElement) return;
      start();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <>
      <Backdrop ref={backdropRef} aria-hidden />
      <Shade aria-hidden />
      <Page>
        <Hero>
          <Title>Bass Weapons</Title>
          <Lead>
            Every gun is a bass synth and every shot lands on the beat. Your
            build is the song. Turn your sound on.
          </Lead>
          <StartRow>
            {/* Not disabled while starting: the button keeps the focus. */}
            <Button onClick={start} aria-disabled={isStarting}>
              {isStarting ? 'Dropping in…' : 'Drop in'}
            </Button>
            {!isStarting && (
              <Shortcut>
                or press <Key>Enter</Key>
              </Shortcut>
            )}
            {/* Always there, so a screen reader hears each step arrive. */}
            <Status role="status">
              {isStarting && step ? STEP_LABELS[step] : ''}
            </Status>
          </StartRow>
          <Options>
            <Toggle
              label="Reduce flashing"
              checked={flashingReduced}
              onChange={onFlashingReduced}
            />
          </Options>
          {error && (
            <Status role="alert" $error>
              Couldn't start the game. Press Drop in to try again; if it keeps
              happening, reload the page.
              <small>{error}</small>
            </Status>
          )}
          <Meta>
            {musicalKey} · {bpm} BPM halftime · {levels} levels
            {best > 0 && <> · best {best.toLocaleString('en')}</>}
          </Meta>
        </Hero>
        <Briefing>
          <Group aria-labelledby="loadout-heading">
            <h2 id="loadout-heading">Your loadout</h2>
            <WeaponList>
              {weapons.map((weapon, slot) => (
                <Weapon key={slot}>
                  <Icon icon={WEAPON_ICONS[weapon.oscillator]} />
                  <strong>
                    <Key>{slot + 1}</Key>
                    {weapon.name}
                  </strong>
                  <Traits>{describeTraits(weapon)}</Traits>
                </Weapon>
              ))}
            </WeaponList>
            <p>Swap in loot as you find it.</p>
          </Group>
          <Group aria-labelledby="how-heading">
            <h2 id="how-heading">How to play</h2>
            <Controls $pointer="mouse">
              <dt>
                <Key>WASD</Key>
              </dt>
              <dd>move</dd>
              <dt>
                <Key as="span">Mouse</Key>
              </dt>
              <dd>aim, click or hold to fire</dd>
              <dt>
                <Key>Space</Key>
              </dt>
              <dd>dash</dd>
              <dt>
                <Key>1–3 · Q/E</Key>
              </dt>
              <dd>switch weapon</dd>
              <dt>
                <Key>F</Key>
              </dt>
              <dd>take a weapon</dd>
            </Controls>
            <Controls $pointer="touch">
              <dt>
                <Key as="span">Left thumb</Key>
              </dt>
              <dd>aim, push further to move</dd>
              <dt>
                <Key as="span">Right thumb</Key>
              </dt>
              <dd>tap or hold to fire</dd>
              <dt>
                <Key as="span">Right edge</Key>
              </dt>
              <dd>hold a weapon to switch and fire it</dd>
              <dt>
                <Key as="span">Dash</Key>
              </dt>
              <dd>the round button, bottom right</dd>
            </Controls>
            <p>Shots snap to the beat; a press right on it hits harder.</p>
          </Group>
        </Briefing>
      </Page>
    </>
  );
};
