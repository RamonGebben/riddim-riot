import styled, { css } from 'styled-components';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

/**
 * `primary` is the big call to action, one per screen. `secondary` is the
 * same pill outlined, for the other ways on. `quiet` is a compact outlined
 * button for dense tool UIs; with `aria-pressed` it reads as a toggle. The
 * pills draw compact, to leave room for the game, and keep a full-size
 * touch target in an invisible band above and below; on a phone their type
 * goes a size down too.
 */
export const Button = styled.button<{ $variant?: ButtonVariant }>`
  position: relative;
  min-block-size: 2.25em;
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('base')};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('primary')};
  color: ${({ theme }) => theme.color('primary', 'text')};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSize('base')};
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
    $variant === 'secondary' &&
    css`
      border: ${theme.borderWidth('s')} solid
        color-mix(
          in srgb,
          ${theme.color('background', 'text')} 25%,
          transparent
        );
      background: transparent;
      color: ${theme.color('background', 'text')};
      font-weight: ${theme.fontWeight('medium')};

      &:hover {
        border-color: ${theme.color('primary')};
        background: ${theme.color('formBackground')};
      }
    `}

  ${({ $variant, theme }) =>
    $variant !== 'quiet' &&
    css`
      &::after {
        content: '';
        position: absolute;
        inset: min(calc((2.25em - ${theme.minTarget()}) / 2), 0px) 0;
      }

      @media (max-height: 500px), (max-width: 479px) {
        font-size: ${theme.fontSize('s')};
      }
    `}

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
