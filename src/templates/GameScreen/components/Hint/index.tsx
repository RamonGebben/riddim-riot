import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

/**
 * Sits over the stage's canvas, out of the way of the trigger: a line
 * above the circle's prompt, which sits on the weapons, with a mouse; on a
 * touch screen, at the bottom between the thumbs, clear of the weapons'
 * column and the dash button on the right.
 */
export const Hint = styled.p`
  position: absolute;
  inset-block-end: calc(
    ${({ theme }) => theme.spacing('l')} * 2.5 + 2.25em +
      env(safe-area-inset-bottom, 0px)
  );
  inset-inline: ${({ theme }) => theme.spacing('l')};
  margin: 0;
  text-align: center;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('m')};
  pointer-events: none;

  @media ${TOUCH_SCREEN} {
    inset-block-end: calc(
      ${({ theme }) => theme.spacing('s')} + env(safe-area-inset-bottom, 0px)
    );
    inset-inline: max(5rem, 22%);
    font-size: ${({ theme }) => theme.fontSize('s')};
  }
`;
