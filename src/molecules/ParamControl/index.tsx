import { useId, useState } from 'react';
import { NumberInput } from '~/atoms/NumberInput';
import { RangeInput } from '~/atoms/RangeInput';
import { Select } from '~/atoms/Select';
import { TextInput } from '~/atoms/TextInput';
import { parseDegrees, type Field } from '~/game/sound/schema';
import { Controls } from './components/Controls';
import { Hint } from './components/Hint';
import { Label } from './components/Label';
import { Row } from './components/Row';

export interface ParamControlProps {
  field: Field;
  value: unknown;
  /** Differs from what's saved in the game. */
  changed: boolean;
  onChange: (value: unknown) => void;
}

const DegreesInput = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Array<number>;
  onChange: (value: Array<number>) => void;
}) => {
  // While editing, show what's typed (even if it doesn't parse yet);
  // otherwise show the value, so a reset elsewhere shows up here.
  const [editing, setEditing] = useState<string | null>(null);
  const text = editing ?? value.join(', ');
  return (
    <TextInput
      id={id}
      value={text}
      $invalid={parseDegrees(text) === null}
      onChange={event => {
        setEditing(event.target.value);
        const next = parseDegrees(event.target.value);
        if (next) onChange(next);
      }}
      onBlur={() => setEditing(null)}
    />
  );
};

/**
 * The number next to a slider. While typing it shows the text as typed - an
 * emptied box or a lone "-" is someone mid-edit - and commits each time the
 * text is a number; otherwise it shows the value.
 */
const NumberBox = ({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: { min: number; max: number; step: number };
  value: number;
  onChange: (value: number) => void;
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <NumberInput
      aria-label={label}
      min={field.min}
      max={field.max}
      step={field.step}
      value={editing ?? value}
      onChange={event => {
        const raw = event.target.value;
        setEditing(raw);
        const next = Number(raw);
        if (raw.trim() !== '' && Number.isFinite(next)) onChange(next);
      }}
      onBlur={() => setEditing(null)}
    />
  );
};

/** Any field of the sound design schema, as the right kind of control. */
export const ParamControl = ({
  field,
  value,
  changed,
  onChange,
}: ParamControlProps) => {
  const id = useId();

  if (field.kind === 'choice') {
    return (
      <Row $changed={changed}>
        <Label htmlFor={id}>{field.label}</Label>
        <Select
          id={id}
          value={String(value)}
          onChange={event => {
            const picked = field.options.find(
              option => String(option) === event.target.value,
            );
            onChange(picked);
          }}
        >
          {field.options.map(option => (
            <option key={option} value={String(option)}>
              {option}
            </option>
          ))}
        </Select>
        {field.hint && <Hint>{field.hint}</Hint>}
      </Row>
    );
  }

  if (field.kind === 'degrees') {
    return (
      <Row $changed={changed}>
        <Label htmlFor={id}>{field.label}</Label>
        <DegreesInput
          id={id}
          value={value as Array<number>}
          onChange={onChange}
        />
        {field.hint && <Hint>{field.hint}</Hint>}
      </Row>
    );
  }

  const number = value as number;

  return (
    <Row $changed={changed}>
      <Label htmlFor={id}>
        <span>{field.label}</span>
        <span>{field.unit}</span>
      </Label>
      <Controls>
        <RangeInput
          id={id}
          min={field.min}
          max={field.max}
          step={field.step}
          value={number}
          onChange={event => onChange(Number(event.target.value))}
        />
        <NumberBox
          label={`${field.label} value`}
          field={field}
          value={number}
          onChange={onChange}
        />
      </Controls>
      {field.hint && <Hint>{field.hint}</Hint>}
    </Row>
  );
};
