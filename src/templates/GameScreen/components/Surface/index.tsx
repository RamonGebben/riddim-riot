import styled from 'styled-components';

/** The play area: takes the trigger, so no text selection or touch panning. */
export const Surface = styled.main`
  position: fixed;
  inset: 0;
  block-size: 100dvh;
  overflow: hidden;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
`;
