import type { ReactNode } from 'react';
import { Button } from '~/atoms/Button';
import { Group } from './components/Group';
import { Legend } from './components/Legend';
import { Options } from './components/Options';

export interface SegmentedControlProps<T extends string> {
  label: string;
  /** A label can carry an icon or a count beside its words. */
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}

/** Pick one of a few: a row of toggle buttons, the chosen one pressed. */
export const SegmentedControl = <T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => {
  return (
    <Group>
      <Legend>{label}</Legend>
      <Options>
        {options.map(option => (
          <Button
            key={option.value}
            type="button"
            $variant="quiet"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Options>
    </Group>
  );
};
