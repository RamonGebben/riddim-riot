import styled from 'styled-components';

export const Legend = styled.legend`
  margin-block-end: ${({ theme }) => theme.spacing('xxs')};
  padding: 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
