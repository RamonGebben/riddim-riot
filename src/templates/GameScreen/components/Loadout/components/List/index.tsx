import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

export const List = styled.ol`
  position: fixed;
  inset-block-end: calc(
    ${({ theme }) => theme.spacing('base')} + env(safe-area-inset-bottom, 0px)
  );
  inset-inline: 0;
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing('s')};
  margin: 0 auto;
  padding: 0;
  list-style: none;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  pointer-events: none;

  /* A column of fire buttons under the right thumb, below the HUD. */
  @media ${TOUCH_SCREEN} {
    inset-block: calc(${({ theme }) => theme.spacing('l')} * 2.5) auto;
    inset-inline: auto
      calc(
        ${({ theme }) => theme.spacing('base')} +
          env(safe-area-inset-right, 0px)
      );
    flex-direction: column;
    align-items: end;
  }
`;
