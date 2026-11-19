import styled, { css, keyframes } from 'styled-components';

const arrive = keyframes`
  from { transform: scale(1.8); }
  to { transform: scale(1); }
`;

export const Heart = styled.span<{ $kind: 'full' | 'lost' | 'bonus' }>`
  display: inline-flex;
  color: ${({ theme }) => theme.color('error')};
  filter: drop-shadow(0 0 4px currentColor);
  animation: ${arrive} 0.25s ease-out;

  ${({ $kind, theme }) =>
    $kind === 'lost' &&
    css`
      color: ${theme.color('formBackground', 'emphasis')};
      filter: none;
    `}
  ${({ $kind, theme }) =>
    $kind === 'bonus' &&
    css`
      color: ${theme.color('quaternary')};
    `}
`;
