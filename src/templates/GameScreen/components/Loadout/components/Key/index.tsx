import styled from 'styled-components';

export const Key = styled.kbd`
  grid-area: key;
  color: ${({ theme }) => theme.color('primary')};
  font: inherit;
`;
