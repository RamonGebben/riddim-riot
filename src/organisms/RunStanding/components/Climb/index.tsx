import styled from 'styled-components';

/** Places gained: a reward, so it's amber and it glows. */
export const Climb = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  margin: 0;
  color: ${({ theme }) => theme.color('quaternary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  filter: drop-shadow(0 0 4px currentColor);
`;
