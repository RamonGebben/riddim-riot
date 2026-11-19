import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

/**
 * The touch screen's F: a small pill at the bottom centre, clear of the
 * stick and the fire column, naming the weapon underfoot.
 */
export const TakeButton = styled.button`
  display: none;

  @media ${TOUCH_SCREEN} {
    position: fixed;
    inset-block-end: calc(
      ${({ theme }) => theme.spacing('base')} + env(safe-area-inset-bottom, 0px)
    );
    inset-inline: 0;
    z-index: ${({ theme }) => theme.zIndex('sticky')};
    display: flex;
    align-items: center;
    gap: 0.4em;
    inline-size: max-content;
    max-inline-size: 50vw;
    min-block-size: ${({ theme }) => theme.minTarget()};
    margin-inline: auto;
    padding: ${({ theme }) => theme.spacing('xxs')}
      ${({ theme }) => theme.spacing('base')};
    border: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('primary')};
    border-radius: ${({ theme }) => theme.borderRadius('full')};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.color('background')} 72%,
      transparent
    );
    backdrop-filter: blur(6px);
    color: ${({ theme }) => theme.color('background', 'text')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    white-space: nowrap;
    cursor: pointer;
    touch-action: manipulation;

    &:active {
      transform: scale(0.96);
    }
  }
`;
