import styled from 'styled-components';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Label = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xs')};
  min-block-size: ${({ theme }) => theme.minTarget()};
  color: ${({ theme }) => theme.color('background', 'text')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  cursor: pointer;
`;

/** The real checkbox: invisible, but it keeps the focus and the state. */
const Input = styled.input`
  position: absolute;
  opacity: 0;
  inline-size: 1px;
  block-size: 1px;
  margin: 0;
`;

const Track = styled.span`
  position: relative;
  flex: none;
  inline-size: 2.25em;
  block-size: 1.25em;
  /* Off, the track still reads against the dark: a mid-grey rim. */
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('secondary')} 60%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('formBackground')};

  &::after {
    content: '';
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 0.2em;
    inline-size: 0.8em;
    block-size: 0.8em;
    border-radius: ${({ theme }) => theme.borderRadius('full')};
    background: ${({ theme }) => theme.color('secondary')};
    transform: translateY(-50%);
    transition: transform 0.15s ease-out;
  }

  ${Input}:checked + & {
    border-color: ${({ theme }) => theme.color('primary')};
    background: ${({ theme }) => theme.color('primary')};
  }

  ${Input}:checked + &::after {
    background: ${({ theme }) => theme.color('primary', 'text')};
    transform: translate(1em, -50%);
  }

  ${Input}:focus-visible + & {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }
`;

/** An on/off setting: a switch with its label beside it. */
export const Toggle = ({ label, checked, onChange }: ToggleProps) => {
  return (
    <Label>
      <Input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        // A switch flips on Enter too, not only Space - and the page around
        // it never takes that Enter for its own.
        onKeyDown={event => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          event.stopPropagation();
          onChange(!checked);
        }}
      />
      <Track aria-hidden />
      {label}
    </Label>
  );
};
