import styled from 'styled-components';

export const Note = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
