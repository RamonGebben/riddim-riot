import styled from 'styled-components';

export const Lead = styled.p`
  margin: 0;
  max-inline-size: 32em;
  font-size: ${({ theme }) => theme.fontSize('m')};
`;
