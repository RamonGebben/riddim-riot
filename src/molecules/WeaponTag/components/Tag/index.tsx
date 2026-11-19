import styled from 'styled-components';

export const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  color: ${({ theme }) => theme.color('primary')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  vertical-align: middle;
`;
