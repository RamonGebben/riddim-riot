import { createGlobalStyle } from 'styled-components';

/**
 * While playing, the page itself never scrolls, rubber-bands or zooms: on a
 * phone a drag that reaches the document would pull the browser's bars in
 * and out and shift the stage.
 */
export const LockPage = createGlobalStyle`
  /* game screen: page locked */
  html,
  body {
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: none;
  }
`;
