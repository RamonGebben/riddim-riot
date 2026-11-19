import type { Ref } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { WeaponTag, type WeaponFace } from '~/molecules/WeaponTag';
import { Backdrop } from './components/Backdrop';
import { Card } from './components/Card';
import { Cards } from './components/Cards';
import { Controls } from './components/Controls';
import { Hero } from './components/Hero';
import { Kicker } from './components/Kicker';
import { Lead } from './components/Lead';
import { Meta } from './components/Meta';
import { Page } from './components/Page';
import { SeedRow } from './components/SeedRow';
import { Shade } from './components/Shade';
import { Status } from './components/Status';
import { Title } from './components/Title';
import { Weapons } from './components/Weapons';

export interface StartScreenProps {
  /** The first level's key, e.g. "F minor". */
  musicalKey: string;
  bpm: number;
  /** Levels in a run. */
  levels: number;
  /** The best score on this device; 0 hides it. */
  best: number;
  /** The run's seed as typed, or the number it rolled. */
  seed: string;
  /** The weapons the run opens with. */
  weapons: Array<WeaponFace>;
  /** Audio is starting up; the button waits for it. */
  isStarting: boolean;
  /** Where starting has got to, shown while it runs. */
  step: StartStep | null;
  /** Why the last start failed. */
  error: string | null;
  /** Where the live level is drawn behind the page. */
  backdropRef?: Ref<HTMLDivElement>;
  onStart: () => void;
  /** A seed typed in: a number, or any word. */
  onSeed: (seed: string) => void;
  onRollSeed: () => void;
}

export type StartStep = 'audio' | 'kit' | 'weapons';

const STEP_LABELS = {
  audio: 'Starting audio…',
  kit: 'Building the drum kit…',
  weapons: 'Measuring your weapons…',
} satisfies Record<StartStep, string>;

export const StartScreen = ({
  musicalKey,
  bpm,
  levels,
  best,
  seed,
  weapons,
  isStarting,
  step,
  error,
  backdropRef,
  onStart,
  onSeed,
  onRollSeed,
}: StartScreenProps) => {
  return (
    <>
      <Backdrop ref={backdropRef} aria-hidden />
      <Shade aria-hidden />
      <Page>
        <Hero>
          <Kicker>A rhythm roguelite</Kicker>
          <Title>Bass Weapons</Title>
          <Lead>
            Every gun is a bass synth and every shot lands on the beat. Your
            build is the song. Turn your sound on.
          </Lead>
          <Button onClick={onStart} disabled={isStarting}>
            Press to start
          </Button>
          {isStarting && step && (
            <Status role="status">{STEP_LABELS[step]}</Status>
          )}
          {error && (
            <Status role="alert" $error>
              Couldn't start: {error}
            </Status>
          )}
          <Meta>
            {musicalKey} · {bpm} BPM halftime · {levels} levels
            {best > 0 && <> · best {best.toLocaleString('en')}</>}
          </Meta>
        </Hero>
        <Cards>
          <Card aria-labelledby="loadout-heading">
            <h2 id="loadout-heading">Your loadout</h2>
            <Weapons>
              {weapons.map((weapon, slot) => (
                <li key={slot}>
                  <kbd>{slot + 1}</kbd>
                  <WeaponTag {...weapon} />
                </li>
              ))}
            </Weapons>
            <p>
              Slow beats hit hard and blast; fast ones spray. Swap in loot as
              you find it.
            </p>
          </Card>
          <Card aria-labelledby="how-heading">
            <h2 id="how-heading">How to play</h2>
            <Controls $pointer="mouse">
              <dt>WASD</dt>
              <dd>move</dd>
              <dt>Mouse</dt>
              <dd>aim, click or hold to fire</dd>
              <dt>Space</dt>
              <dd>dash</dd>
              <dt>1-3 · Q/E</dt>
              <dd>switch weapon</dd>
              <dt>F</dt>
              <dd>take a weapon</dd>
            </Controls>
            <Controls $pointer="touch">
              <dt>Left thumb</dt>
              <dd>aim, push further to move</dd>
              <dt>Right thumb</dt>
              <dd>tap or hold to fire</dd>
              <dt>Weapon</dt>
              <dd>hold one to fire it</dd>
              <dt>Dash</dt>
              <dd>the round button</dd>
            </Controls>
            <p>
              Step into the circle to start the song. Shots snap to the beat; a
              press right on it hits harder.
            </p>
          </Card>
          <Card aria-labelledby="seed-heading">
            <h2 id="seed-heading">Seed</h2>
            <SeedRow>
              <TextInput
                aria-label="Seed"
                value={seed}
                onChange={event => onSeed(event.target.value)}
                spellCheck={false}
              />
              <Button $variant="quiet" onClick={onRollSeed}>
                Roll
              </Button>
            </SeedRow>
            <p>
              A number or any word. The same seed plays the same levels, weapons
              and music.
            </p>
          </Card>
        </Cards>
      </Page>
    </>
  );
};
