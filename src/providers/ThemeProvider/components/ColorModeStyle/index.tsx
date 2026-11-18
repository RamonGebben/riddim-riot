import { createGlobalStyle } from 'styled-components';

// styled-components derives a global style's id from its template text, so
// the comment keeps this one distinct from RootStyle's otherwise identical
// template - without it, only one of the two gets injected.
export const ColorModeStyle = createGlobalStyle`
  /* color modes */
  ${({ theme }) => theme.colorModeCss()}
`;
