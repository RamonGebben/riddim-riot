import styled from 'styled-components';
import { TOUCH_SCREEN } from '~/utils/landscape';

export const Slot = styled.button<{ $active: boolean }>`
  position: relative;
  display: grid;
  grid-template-columns: auto auto auto auto;
  grid-template-areas:
    'key engine rate badges'
    'mag mag mag mag';
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('xs')};
  min-inline-size: 8.5em;
  padding: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('s')};
  border: ${({ theme }) => theme.borderWidth('base')} solid
    ${({ theme, $active }) =>
      $active
        ? theme.color('primary')
        : `color-mix(in srgb, ${theme.color('background', 'text')} 15%, transparent)`};
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 72%,
    transparent
  );
  box-shadow: ${({ theme, $active }) =>
    $active
      ? `0 0 14px color-mix(in srgb, ${theme.color('primary')} 55%, transparent)`
      : 'none'};
  backdrop-filter: blur(6px);
  color: ${({ theme, $active }) =>
    $active ? theme.color('background', 'text') : theme.color('secondary')};
  font: inherit;
  cursor: pointer;
  pointer-events: auto;
  touch-action: none;
  transition:
    transform 0.08s,
    border-color 0.08s;

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
  }

  @media ${TOUCH_SCREEN} {
    min-inline-size: 7.5em;
    min-block-size: 3.6em;
  }
`;
