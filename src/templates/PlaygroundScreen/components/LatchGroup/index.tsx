import styled from 'styled-components';
import { Latch } from '~/atoms/Latch';

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Name = styled.span`
  margin-inline-end: ${({ theme }) => theme.spacing('xxs')};
  color: ${({ theme }) => theme.color('tertiary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

/** A named row of latches, one of them pressed: pick one of a few. */
export const LatchGroup = <T extends string>({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string;
  options: Array<{ value: T; label: string; name?: string }>;
  value: T;
  onChange: (value: T) => void;
  tone?: 'design' | 'weapon';
}) => {
  return (
    <Group role="group" aria-label={label}>
      <Name aria-hidden="true">{label}</Name>
      {options.map(option => (
        <Latch
          key={option.value}
          type="button"
          $tone={tone}
          aria-pressed={option.value === value}
          aria-label={option.name}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Latch>
      ))}
    </Group>
  );
};
