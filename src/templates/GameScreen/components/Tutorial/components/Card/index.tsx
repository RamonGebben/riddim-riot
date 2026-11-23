import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

const SHORT = '(max-height: 500px)';

/**
 * Where the circle's prompt sits, growing upward: above the weapons with a
 * mouse, down at the bottom edge between the thumbs on a touch screen.
 * Nothing on it to press, so clicks and touches go through to the game.
 * A step just done glows in the primary colour.
 */
export const Card = styled.section<{ $done: boolean }>`
  position: fixed;
  inset-block-end: calc(
    ${({ theme }) => theme.spacing('l')} * 2.5 +
      env(safe-area-inset-bottom, 0px)
  );
  inset-inline: 0;
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: grid;
  gap: ${({ theme }) => theme.spacing('s')};
  inline-size: min(
    26rem,
    calc(100% - ${({ theme }) => theme.spacing('l')} * 2)
  );
  margin-inline: auto;
  padding: ${({ theme }) => theme.spacing('base')};
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: ${({ theme }) => theme.color('background')};
  box-shadow: ${({ theme }) => theme.boxShadow('modal')};
  outline: ${({ theme }) => theme.borderWidth('base')} solid
    ${({ $done, theme }) => ($done ? theme.color('primary') : 'transparent')};
  transition: outline-color 0.15s;
  pointer-events: none;

  /* The grid display would otherwise override the hidden attribute. */
  &[hidden] {
    display: none;
  }

  & h2 {
    margin: 0;
    font-family: ${({ theme }) => theme.fontFamily('heading')};
    font-size: ${({ theme }) => theme.fontSize('l')};
    line-height: ${({ theme }) => theme.lineHeight('tight')};
  }

  /* Short screens get a tighter card, off the player at the centre. */
  @media ${TOUCH_SCREEN}, ${SHORT} {
    gap: ${({ theme }) => theme.spacing('xs')};
    padding: ${({ theme }) => theme.spacing('s')};
    font-size: ${({ theme }) => theme.fontSize('s')};

    & h2 {
      font-size: ${({ theme }) => theme.fontSize('base')};
    }
  }

  @media ${TOUCH_SCREEN} {
    inset-block-end: calc(
      ${({ theme }) => theme.spacing('s')} + env(safe-area-inset-bottom, 0px)
    );
    inline-size: min(22rem, 50%);
  }
`;
