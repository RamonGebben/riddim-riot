import { useId, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Latch } from '~/atoms/Latch';
import type { FireMode, OneShot, SoundOverrides } from '~/game/playground';
import type { SoundDesign } from '~/game/sound';
import { RACKS, type Engine } from '~/game/sound/racks';
import { DESIGN_SCHEMA, valueAt, type DesignPath } from '~/game/sound/schema';
import type { WeaponSound } from '~/game/weapons';
import type { RiffView } from './components/CurveView';
import { OutputStrip } from './components/OutputStrip';
import { Page } from './components/Page';
import {
  PresetBar,
  type FileProps,
  type PresetProps,
  type TrackProps,
} from './components/PresetBar';
import { RackPanel } from './components/RackPanel';
import { RackTabs } from './components/RackTabs';
import { RangeDeck } from './components/RangeDeck';
import { StartOverlay } from './components/StartOverlay';
import type { Tuning } from './tuning';

export type { ScaleName, Section } from './components/PresetBar';

export interface PlaygroundScreenProps {
  status: 'idle' | 'starting' | 'ready';
  onStart: () => void;
  file: Omit<FileProps, 'unsaved'>;
  design: {
    current: SoundDesign;
    saved: SoundDesign;
    onChange: (path: DesignPath, value: unknown) => void;
  };
  track: TrackProps & { onOneShot: (sound: OneShot) => void };
  weapon: PresetProps & {
    /** What it plays: the roll with any overrides on top. */
    sound: WeaponSound;
    /** The roll's own values, before any override. */
    rolled: WeaponSound;
    overrides: SoundOverrides;
    /** `undefined` goes back to the rolled value. */
    onOverride: (key: keyof SoundOverrides, value: number | undefined) => void;
    /** The riff's notes and the sixteenths between its shots. */
    riff: Omit<RiffView, 'read'>;
    /** Which shot is sounding, read once a frame. */
    readRiffNote: () => number | null;
    fire: FireMode;
    onFire: (mode: FireMode) => void;
    onTap: () => void;
  };
  /** Mounts the firing range; null until the audio has started. */
  mountRange: ((element: HTMLElement) => () => void) | null;
}

const ENGINES: Array<string> = ['wobble', 'laser', 'beam'];
const FIELD_PATHS = DESIGN_SCHEMA.flatMap(group =>
  group.fields.map(field => field.path),
);

/**
 * The rack beside the range and the output strip. Stacked, the range comes
 * first: firing the weapon is what the page is for.
 */
const Workbench = styled.div`
  display: grid;
  grid-template-areas: 'range' 'rack' 'output';
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.spacing('s')};

  @media (min-width: 1100px) {
    grid-template-areas: 'rack range' 'rack output';
    grid-template-columns: minmax(0, 1fr) minmax(20rem, 26rem);
    grid-template-rows: auto 1fr;
  }
`;

const Area = styled.div<{ $area: string }>`
  grid-area: ${({ $area }) => $area};
  min-inline-size: 0;
`;

const Instruments = styled(Area)`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};
  min-inline-size: 0;
`;

const Notice = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xs')};
  margin: 0;
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('xs')};
  border: ${({ theme }) => theme.borderWidth('s')} dashed
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  color: ${({ theme }) => theme.color('background', 'text')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;

/**
 * The sound playground as a synth's front panel: the weapon as a preset
 * across the top, a rack per instrument drawn as curves and knobs, and the
 * firing range beside it to play the weapon as the game does. Blue is the
 * sound design; amber is the weapon being auditioned.
 */
export const PlaygroundScreen = ({
  status,
  onStart,
  file,
  design,
  track,
  weapon,
  mountRange,
}: PlaygroundScreenProps) => {
  const ids = useId();
  const armed = weapon.sound.oscillator;
  const [active, setActive] = useState<string>(armed);
  const rack = RACKS.find(candidate => candidate.id === active) ?? RACKS[0];
  const unsaved = useMemo(
    () =>
      FIELD_PATHS.filter(
        path =>
          JSON.stringify(valueAt(design.current, path)) !==
          JSON.stringify(valueAt(design.saved, path)),
      ).length,
    [design],
  );
  const tuning: Tuning = {
    design: design.current,
    saved: design.saved,
    set: design.onChange,
    weapon: {
      sound: weapon.sound,
      rolled: weapon.rolled,
      overrides: weapon.overrides,
      override: weapon.onOverride,
    },
  };
  const riff: RiffView = { ...weapon.riff, read: weapon.readRiffNote };
  const tabId = (id: string) => `${ids}-tab-${id}`;
  const panelId = `${ids}-panel`;
  const otherEngine = ENGINES.includes(rack.id) && rack.id !== armed;

  return (
    <Page>
      {status !== 'ready' && (
        <StartOverlay isStarting={status === 'starting'} onStart={onStart} />
      )}
      <PresetBar preset={weapon} track={track} file={{ ...file, unsaved }} />
      <Workbench>
        <Instruments $area="rack">
          <RackTabs
            racks={RACKS}
            active={rack.id}
            armed={armed}
            onSelect={setActive}
            tabId={tabId}
            panelId={panelId}
          />
          {otherEngine && (
            <Notice>
              You&apos;re hearing a {armed}: this rack shapes every{' '}
              {rack.label.toLowerCase()}.
              <Latch
                type="button"
                onClick={() =>
                  weapon.onPins({
                    ...weapon.pins,
                    oscillator: rack.id as Engine,
                  })
                }
              >
                Audition a {rack.label.toLowerCase()}
              </Latch>
            </Notice>
          )}
          <RackPanel
            rack={rack}
            tuning={tuning}
            riff={riff}
            onTrigger={track.onOneShot}
            id={panelId}
            labelledBy={tabId(rack.id)}
          />
        </Instruments>
        <Area $area="range">
          <RangeDeck
            fire={weapon.fire}
            onFire={weapon.onFire}
            onTap={weapon.onTap}
            mountRange={mountRange}
          />
        </Area>
        <Area $area="output">
          <OutputStrip tuning={tuning} onTrigger={track.onOneShot} />
        </Area>
      </Workbench>
    </Page>
  );
};
