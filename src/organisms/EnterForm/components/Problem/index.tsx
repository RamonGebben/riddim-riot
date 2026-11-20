import styled from 'styled-components';

export const Problem = styled.span`
  color: ${({ theme }) => theme.color('error')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
