import styled from 'styled-components';
import { Icon } from '~/atoms/Icon';
import { Latch } from '~/atoms/Latch';
import { NEXT_ICON, PREVIOUS_ICON } from '~/game/icons';
import { Select } from '~/atoms/Select';
import type { WeaponPins } from '~/game/weapons';
import { LatchGroup } from '../LatchGroup';
import { Meter } from '../Meter';
import { FilePicker } from './components/FilePicker';

export type Section = 'calm' | 'groove' | 'build' | 'drop';
export type ScaleName = 'minor' | 'phrygian';

export interface FileProps {
  /** Design values that differ from what's saved. */
  unsaved: number;
  /** The last save, export or import result. */
  message: string | null;
  onSave: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  /** Back to what the game has saved. */
  onRevert: () => void;
  /** Back to the values the game shipped with. */
  onBase: () => void;
}

export interface TrackProps {
  root: number;
  scale: ScaleName;
  onKey: (root: number, scale: ScaleName) => void;
  drums: boolean;
  onDrums: (on: boolean) => void;
  section: Section;
  onSection: (section: Section) => void;
  readLevel: () => number;
}

export interface PresetProps {
  name: string;
  seed: number;
  /** What loudness normalization set its channel to, once it's armed. */
  gainDb: number | null;
  pins: WeaponPins;
  onPins: (pins: WeaponPins) => void;
  onSeed: (seed: number) => void;
  onRoll: () => void;
  rolls: Array<{ seed: number; name: string }>;
  onRollMany: () => void;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ANY = 'any';

const Bar = styled.header`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xxs')};
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('xs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};
`;

const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('m')};
`;

const Cluster = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px ${({ theme }) => theme.spacing('xxs')};
`;

/** The preset and its stepping keep together, unless the screen is narrow. */
const Preset = styled(Cluster)`
  position: relative;
  flex-wrap: nowrap;

  @media (max-width: 700px) {
    flex-wrap: wrap;
  }
`;

/** Pushes what follows to the end of the line. */
const End = styled(Cluster)`
  margin-inline-start: auto;
`;

/** The preset display: the weapon's name on a dark screen, as on a synth. */
const Display = styled.output`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing('xs')};
  min-inline-size: min(20rem, 100%);
  min-block-size: 1.75rem;
  padding: 0 ${({ theme }) => theme.spacing('xs')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('background')};
  line-height: 1.75rem;
  white-space: nowrap;
`;

const Name = styled.span`
  color: ${({ theme }) => theme.color('quaternary')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
`;

const Detail = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
`;

const Status = styled.p<{ $unsaved: boolean }>`
  margin: 0;
  color: ${({ theme, $unsaved }) =>
    $unsaved ? theme.color('primary', 'emphasis') : theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;

const Level = styled.div`
  inline-size: 14rem;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.color('background', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.24em;
  text-transform: uppercase;
`;

/** Eight rolls of the current design, a menu under the preset. */
const Rolls = styled.details`
  position: relative;

  & > summary {
    list-style: none;
  }
  & > summary::-webkit-details-marker {
    display: none;
  }
`;

const RollList = styled.div`
  position: absolute;
  inset-block-start: calc(100% + 4px);
  inset-inline-start: 0;
  z-index: ${({ theme }) => theme.zIndex('dropdown')};
  display: grid;
  gap: 2px;
  min-inline-size: 16rem;
  padding: ${({ theme }) => theme.spacing('xxs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};
  box-shadow: ${({ theme }) => theme.boxShadow('modal')};

  & > button {
    justify-content: flex-start;
  }
`;

const pinOptions = <T extends string>(options: Array<[T, string, string]>) => [
  { value: ANY, label: 'Any', name: 'Any (rolled)' },
  ...options.map(([value, label, name]) => ({ value, label, name })),
];

/**
 * The synth's top strip, two thin rows: the weapon as a preset (stepping
 * through seeds, rolling, eight rolls to compare) and the design file on
 * top; the parts it's pinned to, the track it plays over and the output
 * level under it.
 */
export const PresetBar = ({
  preset,
  track,
  file,
}: {
  preset: PresetProps;
  track: TrackProps;
  file: FileProps;
}) => {
  const { pins, onPins } = preset;
  const pin = <K extends keyof WeaponPins>(part: K, value: string) =>
    onPins({
      ...pins,
      [part]: value === ANY ? undefined : value === 'none' ? null : value,
    });
  const gain =
    preset.gainDb === null
      ? 'measuring…'
      : `${preset.gainDb > 0 ? '+' : ''}${preset.gainDb.toFixed(1)}dB`;

  return (
    <Bar>
      <Line>
        <Title>Sound playground</Title>
        <Preset>
          <Latch
            type="button"
            aria-label="Previous seed"
            onClick={() => preset.onSeed(preset.seed - 1)}
          >
            <Icon icon={PREVIOUS_ICON} />
          </Latch>
          <Display aria-label="Weapon" aria-live="polite">
            <Name>{preset.name}</Name>
            <Detail title="The seed, and the gain loudness normalization gave it">
              #{preset.seed} · {gain}
            </Detail>
          </Display>
          <Latch
            type="button"
            aria-label="Next seed"
            onClick={() => preset.onSeed(preset.seed + 1)}
          >
            <Icon icon={NEXT_ICON} />
          </Latch>
          <Latch type="button" onClick={preset.onRoll}>
            Roll
          </Latch>
          <Rolls>
            <Latch as="summary">Rolls</Latch>
            <RollList role="group" aria-label="Compare rolls">
              {preset.rolls.map(roll => (
                <Latch
                  key={roll.seed}
                  type="button"
                  aria-pressed={roll.seed === preset.seed}
                  title={`Seed ${roll.seed}`}
                  onClick={() => preset.onSeed(roll.seed)}
                >
                  {roll.name}
                </Latch>
              ))}
              <Latch type="button" onClick={preset.onRollMany}>
                8 more
              </Latch>
            </RollList>
          </Rolls>
        </Preset>
        <End>
          <Status $unsaved={file.unsaved > 0} role="status">
            {file.message ??
              (file.unsaved > 0
                ? `${file.unsaved} unsaved`
                : 'Matches the game')}
          </Status>
          <Latch
            type="button"
            $primary
            onClick={file.onSave}
            disabled={file.unsaved === 0}
          >
            Save to game
          </Latch>
          <Latch type="button" onClick={file.onExport}>
            Export
          </Latch>
          <FilePicker>
            Import
            <input
              type="file"
              accept="application/json,.json"
              onChange={event => {
                const picked = event.target.files?.[0];
                if (picked) file.onImport(picked);
                event.target.value = '';
              }}
            />
          </FilePicker>
          <Latch
            type="button"
            onClick={file.onRevert}
            disabled={file.unsaved === 0}
          >
            Revert
          </Latch>
          <Latch type="button" onClick={file.onBase}>
            Base values
          </Latch>
        </End>
      </Line>
      <Line>
        <LatchGroup
          label="Engine"
          options={pinOptions([
            ['wobble', 'Wob', 'Wobble'],
            ['laser', 'Las', 'Laser'],
            ['beam', 'Beam', 'Beam'],
          ])}
          value={pins.oscillator ?? ANY}
          onChange={value => pin('oscillator', value)}
        />
        <LatchGroup
          label="Maker"
          options={pinOptions([
            ['vandal', 'Vdl', 'Vandal'],
            ['lumen', 'Lmn', 'Lumen'],
          ])}
          value={pins.manufacturer ?? ANY}
          onChange={value => pin('manufacturer', value)}
        />
        <LatchGroup
          label="LFO"
          options={pinOptions([
            ['1/2', '1/2', 'Half notes'],
            ['1/4', '1/4', 'Quarter notes'],
            ['1/8', '1/8', 'Eighth notes'],
            ['1/16', '1/16', 'Sixteenth notes'],
          ])}
          value={pins.lfo ?? ANY}
          onChange={value => pin('lfo', value)}
        />
        <LatchGroup
          label="FX"
          options={pinOptions([
            ['none', 'None', 'No FX'],
            ['distortion', 'Crush', 'Crush'],
            ['echo', 'Echo', 'Echo'],
          ])}
          value={pins.fx === undefined ? ANY : (pins.fx ?? 'none')}
          onChange={value => pin('fx', value)}
        />
        <Cluster>
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
        </Cluster>
        <LatchGroup
          label="Section"
          options={[
            { value: 'calm', label: 'Calm' },
            { value: 'groove', label: 'Groove' },
            { value: 'build', label: 'Build' },
            { value: 'drop', label: 'Drop' },
          ]}
          value={track.section}
          onChange={track.onSection}
        />
        <LatchGroup
          label="Drums"
          options={[
            { value: 'on', label: 'On', name: 'Drums on' },
            { value: 'off', label: 'Off', name: 'Drums off' },
          ]}
          value={track.drums ? 'on' : 'off'}
          onChange={value => track.onDrums(value === 'on')}
        />
        <End>
          <Level>
            <Meter read={track.readLevel} />
          </Level>
        </End>
      </Line>
    </Bar>
  );
};
