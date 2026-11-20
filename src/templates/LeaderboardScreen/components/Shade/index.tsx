import styled from 'styled-components';

/** Darkens the level evenly: the board is read, not glanced at. */
export const Shade = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 55%,
    transparent
  );
  pointer-events: none;
`;
