import styled from 'styled-components';

/** "2/7" by the heading, or a tick for the step just done. */
export const Steps = styled.span<{ $done: boolean }>`
  color: ${({ $done, theme }) =>
    $done ? theme.color('primary') : theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ $done, theme }) => theme.fontSize($done ? 'l' : 's')};
  line-height: 1;
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
`;
