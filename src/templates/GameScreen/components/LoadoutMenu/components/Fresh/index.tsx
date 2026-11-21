import styled from 'styled-components';

/** Picked up since the menu was last open: a small amber dot. */
export const Fresh = styled.span`
  position: absolute;
  inset-block-start: ${({ theme }) => theme.spacing('xxs')};
  inset-inline-start: ${({ theme }) => theme.spacing('xxs')};
  inline-size: 0.5em;
  block-size: 0.5em;
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('quaternary')};
  box-shadow: 0 0 6px currentColor;
  color: ${({ theme }) => theme.color('quaternary')};
`;
