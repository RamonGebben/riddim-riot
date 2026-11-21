import styled, { css } from 'styled-components';

/**
 * A word worth noticing on a weapon: amber for a reward (new, boss loot,
 * stronger), outlined for a trade-off, grey for weaker.
 */
export const Tag = styled.span<{ $tone?: 'stronger' | 'trade-off' | 'weaker' }>`
  padding: 0 0.5em;
  border: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('quaternary')};
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('quaternary')};
  color: ${({ theme }) => theme.color('quaternary', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  /* Never under the scale's floor, however small the text around it. */
  font-size: max(0.85em, ${({ theme }) => theme.fontSize('s')});
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.08em;
  line-height: 1.5;
  text-transform: uppercase;
  white-space: nowrap;

  ${({ $tone, theme }) =>
    $tone === 'trade-off' &&
    css`
      border-color: color-mix(
        in srgb,
        ${theme.color('background', 'text')} 40%,
        transparent
      );
      background: transparent;
      color: ${theme.color('background', 'text')};
    `}

  ${({ $tone, theme }) =>
    $tone === 'weaker' &&
    css`
      border-color: ${theme.color('formBackground', 'emphasis')};
      background: transparent;
      color: ${theme.color('secondary')};
    `}
`;
