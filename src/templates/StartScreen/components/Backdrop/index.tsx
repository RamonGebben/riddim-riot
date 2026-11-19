import styled from 'styled-components';

/** The live level behind the page: the game draws into it. */
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.color('background')};
  pointer-events: none;
`;
