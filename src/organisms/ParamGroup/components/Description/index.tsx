import styled from 'styled-components';

export const Description = styled.p`
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing('s')};
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
