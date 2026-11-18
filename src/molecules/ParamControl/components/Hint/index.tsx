import styled from 'styled-components';

export const Hint = styled.small`
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
