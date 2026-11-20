import styled from 'styled-components';

/** A live level behind the board, drawn without sound. */
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.color('background')};
  pointer-events: none;
`;
