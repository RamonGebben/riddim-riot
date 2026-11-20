import styled from 'styled-components';

/** A key to press, set the same wherever the page names one. */
export const Key = styled.kbd`
  color: ${({ theme }) => theme.color('primary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
`;
