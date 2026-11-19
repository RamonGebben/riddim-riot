import { createGlobalStyle } from 'styled-components';

/**
 * While playing, the page itself never scrolls, rubber-bands or zooms: on a
 * phone a drag that reaches the document would pull the browser's bars in
 * and out and shift the stage. Nothing on it selects either - not the HUD,
 * a prompt or an overlay - so a double-click, a drag or a long press never
 * highlights text or brings up the copy menu mid-fight.
 */
export const LockPage = createGlobalStyle`
  /* game screen: page locked */
  html,
  body {
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
`;
