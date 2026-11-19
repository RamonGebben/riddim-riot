import styled from 'styled-components';

/** A bright callout over the stats, like a new best. */
export const Badge = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('base')};
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('quaternary')};
  color: ${({ theme }) => theme.color('background')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;
