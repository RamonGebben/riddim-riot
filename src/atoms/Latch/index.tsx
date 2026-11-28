import styled from 'styled-components';

/**
 * A synth panel's small square push-button: pressed (`aria-pressed`), it
 * lights in its tone. Blue for the sound design and the page's own state,
 * amber only for this weapon's values. `$primary` fills the one action that
 * matters most.
 */
export const Latch = styled.button<{
  $tone?: 'design' | 'weapon';
  /** The one action that matters most here: filled, not bigger. */
  $primary?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-inline-size: 2.25rem;
  min-block-size: 1.75rem;
  padding: 0 ${({ theme }) => theme.spacing('xxs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('background')};
  color: ${({ theme }) => theme.color('background', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.color('secondary')};
  }

  &[aria-pressed='true'] {
    border-color: transparent;
    background: ${({ theme, $tone }) =>
      theme.color($tone === 'weapon' ? 'quaternary' : 'primary')};
    color: ${({ theme, $tone }) =>
      theme.color($tone === 'weapon' ? 'quaternary' : 'primary', 'text')};
  }

  ${({ theme, $primary }) =>
    $primary &&
    `
    border-color: transparent;
    background: ${theme.color('primary')};
    color: ${theme.color('primary', 'text')};

    &:hover {
      border-color: transparent;
      background: ${theme.color('primary', 'emphasis')};
    }
  `}

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;
