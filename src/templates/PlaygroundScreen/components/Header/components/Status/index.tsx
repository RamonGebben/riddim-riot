import styled from 'styled-components';

export const Status = styled.p.attrs({ role: 'status' })`
  margin: 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
