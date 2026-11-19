import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

export const Round = styled.button<{ $ready: boolean }>`
  position: fixed;
  inset-block-end: calc(
    ${({ theme }) => theme.spacing('base')} + env(safe-area-inset-bottom, 0px)
  );
  inset-inline-end: calc(
    ${({ theme }) => theme.spacing('base')} + env(safe-area-inset-right, 0px)
  );
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: grid;
  place-content: center;
  justify-items: center;
  overflow: hidden;
  inline-size: 4.5em;
  block-size: 4.5em;
  padding: 0;
  border: ${({ theme }) => theme.borderWidth('base')} solid
    ${({ theme, $ready }) =>
      $ready
        ? theme.color('quaternary')
        : theme.color('formBackground', 'emphasis')};
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 72%,
    transparent
  );
  box-shadow: ${({ theme, $ready }) =>
    $ready
      ? `0 0 14px color-mix(in srgb, ${theme.color('quaternary')} 50%, transparent)`
      : 'none'};
  backdrop-filter: blur(6px);
  color: ${({ theme, $ready }) =>
    $ready ? theme.color('background', 'text') : theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  text-transform: uppercase;
  cursor: pointer;
  touch-action: none;

  & > * {
    position: relative;
  }

  & kbd {
    color: ${({ theme }) => theme.color('quaternary')};
    font: inherit;
    font-size: 0.8em;
  }

  &:active {
    transform: scale(0.94);
  }

  @media ${TOUCH_SCREEN} {
    inline-size: 5.5em;
    block-size: 5.5em;
  }
`;
