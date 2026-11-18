import styled from 'styled-components';

/** The play area: takes the trigger, so no text selection or touch panning. */
export const Surface = styled.main`
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
`;
