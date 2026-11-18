import { createGlobalStyle } from 'styled-components';

// See ColorModeStyle for why the template carries a comment.
export const RootStyle = createGlobalStyle`
  /* root font size and scale */
  ${({ theme }) => theme.rootCss()}
`;
