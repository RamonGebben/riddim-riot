import styled, { css, keyframes } from 'styled-components';

/** Two beats at 140 BPM, four times: the arcade's new-entry blink. */
const blink = keyframes`
  50% { opacity: 0.35; }
`;

/** A board row; yours is lit, and blinks when it's just arrived. */
export const Row = styled.tr<{ $mine?: boolean; $fresh?: boolean }>`
  td {
    block-size: 2.25em;
    padding: 0 ${({ theme }) => theme.spacing('xs')};
    border-block-start: ${({ theme }) => theme.borderWidth('s')} solid
      color-mix(
        in srgb,
        ${({ theme }) => theme.color('background', 'text')} 8%,
        transparent
      );
    color: ${({ theme }) => theme.color('background', 'text')};
    white-space: nowrap;
  }

  td:first-child {
    inline-size: 4.5em;
    color: ${({ theme }) => theme.color('secondary')};
  }

  td[data-align='end'] {
    text-align: end;
  }

  td[data-quiet] {
    color: ${({ theme }) => theme.color('secondary')};
  }

  ${({ $mine, theme }) =>
    $mine &&
    css`
      background: color-mix(
        in srgb,
        ${theme.color('primary')} 14%,
        transparent
      );

      td,
      td:first-child,
      td[data-quiet] {
        color: ${theme.color('primary')};
        font-weight: ${theme.fontWeight('bold')};
        text-shadow: 0 0 8px currentColor;
      }
    `}

  ${({ $fresh }) =>
    $fresh &&
    css`
      animation: ${blink} 0.857s steps(1, end) 4;

      :root[data-flashing='reduced'] & {
        animation: none;
      }
    `}
`;
