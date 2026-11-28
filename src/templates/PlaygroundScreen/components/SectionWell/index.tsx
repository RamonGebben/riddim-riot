import { useId } from 'react';
import styled from 'styled-components';
import { Knob } from '~/atoms/Knob';
import { Latch } from '~/atoms/Latch';
import type { Section, Trigger } from '~/game/sound/racks';
import { valueAt } from '~/game/sound/schema';
import { weaponValue, WEAPON_FIELDS, type Tuning } from '../../tuning';
import { CurveView, type RiffView } from '../CurveView';
import { PanelLabel } from '../PanelLabel';
import { ParamKnob } from '../ParamKnob';

const WEAPON_LABELS = {
  cutoff: 'Cutoff',
  resonance: 'Reso',
  drive: 'Drive',
  feedback: 'Echo fb',
  wet: 'Echo wet',
} as const;

/** A section inside its row's frame; the row draws the dividers. */
const Well = styled.section`
  display: grid;
  grid-template-rows: auto auto 1fr;
  align-content: start;
  gap: ${({ theme }) => theme.spacing('xs')};
  min-inline-size: 0;
  padding: ${({ theme }) => theme.spacing('xs')};
`;

const Head = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xs')};
  min-block-size: 1.75rem;

  & > h3 {
    flex: 1;
  }
`;

const Knobs = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  align-content: start;
  gap: ${({ theme }) => theme.spacing('xs')} 0.25rem;
`;

/** Amber: the weapon's own knobs, set apart from the design's by a rule. */
const WeaponKnobs = styled.div`
  display: flex;
  gap: 0.25rem;
  padding-inline-start: ${({ theme }) => theme.spacing('xs')};
  border-inline-start: ${({ theme }) => theme.borderWidth('s')} dashed
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('quaternary')} 45%,
      transparent
    );
`;

const Empty = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;

/**
 * One section of a rack: its name, a button to fire what it shapes, its
 * curve and its knobs - the design's in blue, then this weapon's own in
 * amber. Reset puts the section's design values back to what's saved.
 */
export const SectionWell = ({
  section,
  tuning,
  riff,
  onTrigger,
}: {
  section: Section;
  tuning: Tuning;
  riff: RiffView | null;
  onTrigger: (sound: Trigger) => void;
}) => {
  const titleId = useId();
  const { view, knobs, trigger } = section;
  const changed = knobs.filter(
    knob =>
      JSON.stringify(valueAt(tuning.design, knob.path)) !==
      JSON.stringify(valueAt(tuning.saved, knob.path)),
  );
  const engine = view && 'engine' in view ? view.engine : null;
  const armed = engine === null || tuning.weapon.sound.oscillator === engine;
  const weaponKeys = (section.weapon ?? []).filter(
    key =>
      armed &&
      ((key !== 'feedback' && key !== 'wet') || tuning.weapon.rolled.delay),
  );

  return (
    <Well aria-labelledby={titleId}>
      <Head>
        <PanelLabel id={titleId}>{section.title}</PanelLabel>
        {trigger && (
          <Latch
            type="button"
            aria-label={`Play ${section.title}`}
            onClick={() => onTrigger(trigger)}
          >
            Play
          </Latch>
        )}
        <Latch
          type="button"
          aria-label={`Reset ${section.title}`}
          disabled={changed.length === 0}
          onClick={() =>
            changed.forEach(knob =>
              tuning.set(knob.path, valueAt(tuning.saved, knob.path)),
            )
          }
        >
          Reset
        </Latch>
      </Head>
      {view &&
        (view.kind === 'riff' && !riff ? (
          <Empty>
            The riff shows while a {view.engine} is armed: pin the engine above.
          </Empty>
        ) : (
          <CurveView view={view} tuning={tuning} riff={riff} />
        ))}
      <Knobs>
        {knobs.map(knob => (
          <ParamKnob key={knob.path.join('.')} knob={knob} tuning={tuning} />
        ))}
        {weaponKeys.length > 0 && (
          <WeaponKnobs role="group" aria-label="This weapon">
            {weaponKeys.map(key => {
              const { weapon } = tuning;
              const rolled = weaponValue(weapon.rolled, key);
              return (
                <Knob
                  key={key}
                  tone="weapon"
                  label={WEAPON_LABELS[key]}
                  hint={`This roll's ${WEAPON_LABELS[key].toLowerCase()}, for this audition only`}
                  value={weapon.overrides[key] ?? rolled}
                  reference={rolled}
                  {...WEAPON_FIELDS[key]}
                  onChange={value => weapon.override(key, value)}
                  onReset={() => weapon.override(key, undefined)}
                />
              );
            })}
          </WeaponKnobs>
        )}
      </Knobs>
    </Well>
  );
};
