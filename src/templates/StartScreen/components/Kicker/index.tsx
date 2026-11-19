import styled from 'styled-components';

export const Kicker = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('tertiary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.3em;
  text-transform: uppercase;
`;
