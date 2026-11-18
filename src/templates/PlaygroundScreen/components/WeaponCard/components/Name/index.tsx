import styled from 'styled-components';

export const Name = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('m')};
`;
