import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/Select';
import type { FireMode, OneShot, SoundOverrides } from '~/game/playground';
import type { SoundDesign } from '~/game/sound';
import {
  DESIGN_SCHEMA,
  type DesignPath,
  type NumberField,
} from '~/game/sound/schema';
import type { WeaponPins, WeaponSound } from '~/game/weapons';
import { ParamControl } from '~/molecules/ParamControl';
import { SegmentedControl } from '~/molecules/SegmentedControl';
import { ParamGroup } from '~/organisms/ParamGroup';
import { Buttons } from './components/Buttons';
import { Columns } from './components/Columns';
import { Header, type HeaderProps } from './components/Header';
import { Meter } from './components/Meter';
import { Note } from './components/Note';
import { Page } from './components/Page';
import { Panel } from './components/Panel';
import { Stack } from './components/Stack';
import { StartOverlay } from './components/StartOverlay';
import { WeaponCard, type WeaponCardProps } from './components/WeaponCard';

export type Section = 'calm' | 'groove' | 'build' | 'drop';
export type ScaleName = 'minor' | 'phrygian';

export interface PlaygroundScreenProps {
  status: 'idle' | 'starting' | 'ready';
  onStart: () => void;
  file: HeaderProps;
  design: {
    current: SoundDesign;
    saved: SoundDesign;
    onChange: (path: DesignPath, value: unknown) => void;
    onResetGroup: (groupId: string) => void;
  };
  track: {
    root: number;
    scale: ScaleName;
    onKey: (root: number, scale: ScaleName) => void;
    drums: boolean;
    onDrums: (on: boolean) => void;
    section: Section;
    onSection: (section: Section) => void;
    onOneShot: (sound: OneShot) => void;
    readLevel: () => number;
  };
  weapon: WeaponCardProps & {
    pins: WeaponPins;
    onPins: (pins: WeaponPins) => void;
    onSeed: (seed: number) => void;
    onRoll: () => void;
    /** The roll's own values, before any tweak. */
    rolled: WeaponSound;
    overrides: SoundOverrides;
    onOverride: (key: keyof SoundOverrides, value: number) => void;
    onClearOverrides: () => void;
    fire: FireMode;
    onFire: (mode: FireMode) => void;
    onTap: () => void;
  };
  compare: {
    rolls: Array<{ seed: number; name: string }>;
    onRollMany: () => void;
  };
}

const ONE_SHOT_LABELS = {
  impact: 'Impact',
  score: 'Kill + score',
  blast: 'Crush blast',
  reload: 'Reload',
  recharge: 'Beam recharge',
  riser: 'Riser',
  drop: 'Drop hit',
} satisfies Record<OneShot, string>;

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const AUTO = 'auto';
/** A part's choices, led by "Roll": leave it to the seed. */
const pinOptions = <const T extends string>(
  options: Array<[T, string]>,
): Array<{ value: T | typeof AUTO; label: string }> => [
  { value: AUTO, label: 'Roll' },
  ...options.map(([value, label]) => ({ value, label })),
];

const tweak = (
  key: keyof SoundOverrides,
  label: string,
  [min, max, step]: [number, number, number],
  unit?: NumberField['unit'],
): NumberField => ({
  kind: 'number',
  path: [key],
  label,
  min,
  max,
  step,
  unit,
});

const TWEAKS = {
  cutoff: tweak('cutoff', 'Cutoff', [100, 16000, 10], 'Hz'),
  resonance: tweak('resonance', 'Resonance', [0, 20, 0.1]),
  drive: tweak('drive', 'Drive', [0, 0.8, 0.01]),
  feedback: tweak('feedback', 'Echo feedback', [0, 0.9, 0.01]),
  wet: tweak('wet', 'Echo wet', [0, 1, 0.01]),
} satisfies Record<keyof SoundOverrides, NumberField>;

export const PlaygroundScreen = ({
  status,
  onStart,
  file,
  design,
  track,
  weapon,
  compare,
}: PlaygroundScreenProps) => {
  const { pins, rolled, overrides } = weapon;
  const tweaks = (Object.keys(TWEAKS) as Array<keyof SoundOverrides>).filter(
    key => rolled.delay || (key !== 'feedback' && key !== 'wet'),
  );
  const rolledValue = (key: keyof SoundOverrides) => {
    if (key === 'feedback') return rolled.delay?.feedback ?? 0;
    if (key === 'wet') return rolled.delay?.wet ?? 0;
    return rolled[key];
  };

  return (
    <Page>
      {status !== 'ready' && (
        <StartOverlay isStarting={status === 'starting'} onStart={onStart} />
      )}
      <Header {...file} />
      <Columns>
        <Stack>
          <Panel title="Track">
            <Buttons>
              <Select
                aria-label="Root"
                value={track.root}
                onChange={event =>
                  track.onKey(Number(event.target.value), track.scale)
                }
              >
                {NOTES.map((note, root) => (
                  <option key={note} value={root}>
                    {note}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Scale"
                value={track.scale}
                onChange={event =>
                  track.onKey(track.root, event.target.value as ScaleName)
                }
              >
                <option value="minor">minor</option>
                <option value="phrygian">phrygian</option>
              </Select>
            </Buttons>
            <SegmentedControl
              label="Drums"
              options={[
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
              value={track.drums ? 'on' : 'off'}
              onChange={value => track.onDrums(value === 'on')}
            />
            <SegmentedControl
              label="Section (from the next bar)"
              options={[
                { value: 'calm', label: 'Calm' },
                { value: 'groove', label: 'Groove' },
                { value: 'build', label: 'Build' },
                { value: 'drop', label: 'Drop' },
              ]}
              value={track.section}
              onChange={track.onSection}
            />
            <Buttons>
              {(Object.keys(ONE_SHOT_LABELS) as Array<OneShot>).map(sound => (
                <Button
                  key={sound}
                  type="button"
                  $variant="quiet"
                  onClick={() => track.onOneShot(sound)}
                >
                  {ONE_SHOT_LABELS[sound]}
                </Button>
              ))}
            </Buttons>
            <Meter read={track.readLevel} />
          </Panel>

          <Panel title="Weapon">
            <WeaponCard
              name={weapon.name}
              seed={weapon.seed}
              gainDb={weapon.gainDb}
            />
            <Buttons>
              <Button type="button" $variant="quiet" onClick={weapon.onRoll}>
                Roll
              </Button>
              <Button
                type="button"
                $variant="quiet"
                onClick={() => weapon.onSeed(weapon.seed - 1)}
              >
                Previous seed
              </Button>
              <Button
                type="button"
                $variant="quiet"
                onClick={() => weapon.onSeed(weapon.seed + 1)}
              >
                Next seed
              </Button>
            </Buttons>
            <SegmentedControl
              label="Fire"
              options={[
                { value: 'off', label: 'Off' },
                { value: 'hold', label: 'Hold' },
                { value: 'mash', label: 'Mash' },
              ]}
              value={weapon.fire}
              onChange={weapon.onFire}
            />
            <Buttons>
              <Button type="button" $variant="quiet" onClick={weapon.onTap}>
                Tap one shot
              </Button>
            </Buttons>
            <SegmentedControl
              label="Engine"
              options={pinOptions([
                ['wobble', 'Wobble'],
                ['laser', 'Laser'],
                ['beam', 'Beam'],
              ])}
              value={pins.oscillator ?? AUTO}
              onChange={value =>
                weapon.onPins({
                  ...pins,
                  oscillator: value === AUTO ? undefined : value,
                })
              }
            />
            <SegmentedControl
              label="Manufacturer"
              options={pinOptions([
                ['vandal', 'Vandal'],
                ['lumen', 'Lumen'],
              ])}
              value={pins.manufacturer ?? AUTO}
              onChange={value =>
                weapon.onPins({
                  ...pins,
                  manufacturer: value === AUTO ? undefined : value,
                })
              }
            />
            <SegmentedControl
              label="LFO rate"
              options={pinOptions([
                ['1/2', '1/2'],
                ['1/4', '1/4'],
                ['1/8', '1/8'],
                ['1/16', '1/16'],
              ])}
              value={pins.lfo ?? AUTO}
              onChange={value =>
                weapon.onPins({
                  ...pins,
                  lfo: value === AUTO ? undefined : value,
                })
              }
            />
            <SegmentedControl
              label="FX"
              options={pinOptions([
                ['none', 'None'],
                ['distortion', 'Crush'],
                ['echo', 'Echo'],
              ])}
              value={pins.fx === undefined ? AUTO : (pins.fx ?? 'none')}
              onChange={value =>
                weapon.onPins({
                  ...pins,
                  fx:
                    value === AUTO
                      ? undefined
                      : value === 'none'
                        ? null
                        : value,
                })
              }
            />
          </Panel>

          <Panel title="This roll's sound">
            <Note>
              Tweak the rolled values directly. Tweaks are for listening only;
              to change what rolls can land on, use the parts pool.
            </Note>
            {tweaks.map(key => (
              <ParamControl
                key={key}
                field={TWEAKS[key]}
                value={overrides[key] ?? rolledValue(key)}
                changed={overrides[key] !== undefined}
                onChange={value => weapon.onOverride(key, value as number)}
              />
            ))}
            <Buttons>
              <Button
                type="button"
                $variant="quiet"
                onClick={weapon.onClearOverrides}
                disabled={Object.keys(overrides).length === 0}
              >
                Clear tweaks
              </Button>
            </Buttons>
          </Panel>

          <Panel title="Compare rolls">
            <Note>
              Eight seeds from the current design, with the pins above.
            </Note>
            <Buttons>
              {compare.rolls.map(roll => (
                <Button
                  key={roll.seed}
                  type="button"
                  $variant="quiet"
                  aria-pressed={roll.seed === weapon.seed}
                  onClick={() => weapon.onSeed(roll.seed)}
                >
                  {roll.name}
                </Button>
              ))}
            </Buttons>
            <Buttons>
              <Button
                type="button"
                $variant="quiet"
                onClick={compare.onRollMany}
              >
                Roll 8 more
              </Button>
            </Buttons>
          </Panel>
        </Stack>

        <Stack>
          {DESIGN_SCHEMA.map((group, index) => (
            <ParamGroup
              key={group.id}
              group={group}
              design={design.current}
              saved={design.saved}
              open={index === 0}
              onChange={design.onChange}
              onReset={() => design.onResetGroup(group.id)}
            />
          ))}
        </Stack>
      </Columns>
    </Page>
  );
};
