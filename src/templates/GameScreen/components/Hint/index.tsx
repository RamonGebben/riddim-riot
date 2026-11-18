import styled from 'styled-components';

export const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('m')};
  pointer-events: none;
`;
