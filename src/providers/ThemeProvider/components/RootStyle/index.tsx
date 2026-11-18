import { createGlobalStyle } from 'styled-components';

export const RootStyle = createGlobalStyle`
  ${({ theme }) => theme.rootCss()}
`;
