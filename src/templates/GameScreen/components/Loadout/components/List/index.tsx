import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

export const List = styled.ol`
  position: fixed;
  inset-block-end: calc(
    ${({ theme }) => theme.spacing('base')} + env(safe-area-inset-bottom, 0px)
  );
  inset-inline-start: calc(
    ${({ theme }) => theme.spacing('base')} + env(safe-area-inset-left, 0px)
  );
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  pointer-events: none;

  /* Beside the right thumb that swipes through it, below the HUD. */
  @media ${TOUCH_SCREEN} {
    inset-block: calc(${({ theme }) => theme.spacing('l')} * 3.5) auto;
    inset-inline: auto
      calc(
        ${({ theme }) => theme.spacing('base')} +
          env(safe-area-inset-right, 0px)
      );
    justify-items: end;
  }
`;
