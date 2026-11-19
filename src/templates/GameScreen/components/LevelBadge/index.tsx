import styled from 'styled-components';

/** "2/5": the level within the run. */
export const LevelBadge = styled.span`
  color: ${({ theme }) => theme.color('secondary')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.08em;
  white-space: nowrap;
`;
