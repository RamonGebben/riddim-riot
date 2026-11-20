import styled from 'styled-components';

/** What shows where rows would be: empty, loading or failed. */
export const Notice = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: ${({ theme }) => theme.spacing('base')} 0;
  color: ${({ theme, $error }) =>
    $error ? theme.color('error') : theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  text-align: center;
`;
