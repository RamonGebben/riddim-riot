import styled from 'styled-components';

/**
 * The menu itself: the one opaque panel over the frozen level, a fixed
 * width so nothing shifts as weapons move, and never taller than the
 * screen - its columns scroll instead, so Done is always in reach.
 */
export const Sheet = styled.section`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  inline-size: min(62rem, 100%);
  max-block-size: 100%;
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: ${({ theme }) => theme.color('background')};
  box-shadow: ${({ theme }) => theme.boxShadow('modal')};
  overflow: hidden;
`;
