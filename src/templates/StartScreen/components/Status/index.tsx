import styled from 'styled-components';

/** How starting is going, beside the button; or why it failed, under it. */
export const Status = styled.p<{ $error?: boolean }>`
  margin: 0;
  max-inline-size: 34em;
  color: ${({ theme, $error }) =>
    $error ? theme.color('error') : theme.color('secondary')};
  font-family: ${({ theme, $error }) =>
    $error ? 'inherit' : theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};

  & small {
    display: block;
    color: ${({ theme }) => theme.color('secondary')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: inherit;
    overflow-wrap: anywhere;
  }
`;
