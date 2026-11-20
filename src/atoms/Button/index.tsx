import styled, { css } from 'styled-components';

export type ButtonVariant = 'primary' | 'quiet';

/**
 * `primary` is the big call to action. `quiet` is a compact outlined button
 * for dense tool UIs; with `aria-pressed` it reads as a toggle.
 */
export const Button = styled.button<{ $variant?: ButtonVariant }>`
  min-block-size: max(${({ theme }) => theme.minTarget()}, 2.5em);
  padding: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('l')};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('primary')};
  color: ${({ theme }) => theme.color('primary', 'text')};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize('m')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color('primary', 'emphasis')};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: ${({ theme }) => theme.borderWidth('base')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Busy but still focusable: a start that's under way. */
  &[aria-disabled='true'] {
    cursor: progress;
    background: ${({ theme }) => theme.color('primary', 'emphasis')};
  }

  ${({ $variant, theme }) =>
    $variant === 'quiet' &&
    css`
      min-block-size: ${theme.minTarget()};
      padding: ${theme.spacing('xxs')} ${theme.spacing('s')};
      border: ${theme.borderWidth('s')} solid
        ${theme.color('formBackground', 'emphasis')};
      border-radius: ${theme.borderRadius('s')};
      background: transparent;
      color: ${theme.color('background', 'text')};
      font-size: ${theme.fontSize('s')};
      font-weight: ${theme.fontWeight('medium')};

      &:hover {
        background: ${theme.color('formBackground')};
      }

      &[aria-pressed='true'] {
        border-color: ${theme.color('primary')};
        background: ${theme.color('primary')};
        color: ${theme.color('primary', 'text')};
      }
    `}
`;
