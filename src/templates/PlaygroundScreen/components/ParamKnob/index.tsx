import { useId, useState } from 'react';
import styled from 'styled-components';
import { Knob } from '~/atoms/Knob';
import { Latch } from '~/atoms/Latch';
import { TextInput } from '~/atoms/TextInput';
import type { Knob as KnobSpec } from '~/game/sound/racks';
import { parseDegrees, valueAt } from '~/game/sound/schema';
import { fieldAt, type Tuning } from '../../tuning';

const SHORT: Record<string, string> = {
  sawtooth: 'Saw',
  square: 'Sqr',
  triangle: 'Tri',
  sine: 'Sin',
};

const Choice = styled.fieldset<{ $changed: boolean }>`
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 0.25rem;
  min-inline-size: 4.25rem;
  margin: 0;
  padding: 0;
  border: none;

  legend {
    float: left;
    inline-size: 100%;
    margin-block-end: 0.125rem;
    color: ${({ theme, $changed }) =>
      $changed
        ? theme.color('primary', 'emphasis')
        : `color-mix(in srgb, ${theme.color('background', 'text')} 78%, transparent)`};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    text-align: center;
    text-transform: uppercase;
  }
`;

/** More than three choices go two abreast, to keep to a knob's height. */
const Options = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, auto);
  gap: 2px;
`;

const Degrees = styled.label<{ $changed: boolean }>`
  display: grid;
  gap: 0.25rem;
  min-inline-size: 9rem;
  color: ${({ theme, $changed }) =>
    $changed
      ? theme.color('primary', 'emphasis')
      : `color-mix(in srgb, ${theme.color('background', 'text')} 78%, transparent)`};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  text-transform: uppercase;
`;

/** A list of degrees as typed: the text while editing, else the value. */
const DegreesInput = ({
  label,
  hint,
  value,
  changed,
  onChange,
}: {
  label: string;
  hint?: string;
  value: Array<number>;
  changed: boolean;
  onChange: (value: Array<number>) => void;
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  const text = editing ?? value.join(', ');
  return (
    <Degrees $changed={changed} title={hint}>
      {label}
      <TextInput
        value={text}
        $invalid={parseDegrees(text) === null}
        onChange={event => {
          setEditing(event.target.value);
          const next = parseDegrees(event.target.value);
          if (next) onChange(next);
        }}
        onBlur={() => setEditing(null)}
      />
    </Degrees>
  );
};

/** One knob of a rack: a dial, a set of latches or a degree list. */
export const ParamKnob = ({
  knob,
  tuning,
}: {
  knob: KnobSpec;
  tuning: Tuning;
}) => {
  const id = useId();
  const field = fieldAt(knob.path);
  const value = valueAt(tuning.design, knob.path);
  const saved = valueAt(tuning.saved, knob.path);
  const changed = JSON.stringify(value) !== JSON.stringify(saved);
  const set = (next: unknown) => tuning.set(knob.path, next);

  if (field.kind === 'number') {
    return (
      <Knob
        label={knob.label}
        hint={field.hint ?? field.label}
        value={typeof value === 'number' ? value : field.min}
        reference={typeof saved === 'number' ? saved : field.min}
        min={field.min}
        max={field.max}
        step={field.step}
        unit={field.unit}
        onChange={set}
        onReset={() => set(saved)}
      />
    );
  }

  if (field.kind === 'choice') {
    return (
      <Choice $changed={changed} aria-describedby={field.hint ? id : undefined}>
        <legend title={field.label}>{knob.label}</legend>
        <Options $columns={field.options.length > 3 ? 2 : 1}>
          {field.options.map(option => (
            <Latch
              key={option}
              type="button"
              aria-pressed={option === value}
              aria-label={`${field.label}: ${option}`}
              onClick={() => set(option)}
            >
              {SHORT[String(option)] ?? option}
            </Latch>
          ))}
        </Options>
        {field.hint && (
          <span id={id} hidden>
            {field.hint}
          </span>
        )}
      </Choice>
    );
  }

  return (
    <DegreesInput
      label={knob.label}
      hint={field.hint ?? field.label}
      value={Array.isArray(value) ? value : []}
      changed={changed}
      onChange={set}
    />
  );
};
