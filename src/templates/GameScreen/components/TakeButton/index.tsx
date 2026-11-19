import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TOUCH_SCREEN } from '~/utils/landscape';

/** The touch screen's F: right side, within the trigger thumb's reach. */
export const TakeButton = styled(Button)`
  display: none;

  @media ${TOUCH_SCREEN} {
    position: fixed;
    inset-block-start: 50%;
    inset-inline-end: calc(
      ${({ theme }) => theme.spacing('l')} + env(safe-area-inset-right, 0px)
    );
    z-index: ${({ theme }) => theme.zIndex('sticky')};
    display: block;
    max-inline-size: 40vw;
    translate: 0 -50%;
  }
`;
