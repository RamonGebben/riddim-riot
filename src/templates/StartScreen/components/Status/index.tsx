import styled from 'styled-components';

/** How starting is going, under the button. */
export const Status = styled.p<{ $error?: boolean }>`
  margin: 0;
  color: ${({ theme, $error }) =>
    $error ? theme.color('error') : theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
