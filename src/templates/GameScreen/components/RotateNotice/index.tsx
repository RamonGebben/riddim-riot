import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

/** Covers the game on a phone held upright: it only plays in landscape. */
export const RotateNotice = styled.p.attrs({ role: 'alert' })`
  display: none;

  @media ${TOUCH_SCREEN} and (orientation: portrait) {
    position: fixed;
    inset: 0;
    z-index: ${({ theme }) => theme.zIndex('modal')};
    display: grid;
    place-items: center;
    margin: 0;
    padding: ${({ theme }) => theme.spacing('l')};
    background: ${({ theme }) => theme.color('background')};
    color: ${({ theme }) => theme.color('background', 'text')};
    font-size: ${({ theme }) => theme.fontSize('l')};
    text-align: center;
  }
`;
