import styled from 'styled-components';

/** The top of the screen: health, the song, the score. */
export const Hud = styled.header`
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: ${({ theme }) => theme.spacing('s')};
  padding: ${({ theme }) => theme.spacing('s')}
    ${({ theme }) => theme.spacing('base')};
  /* Clear of a notch or a rounded corner (viewport-fit=cover). */
  padding-block-start: max(
    ${({ theme }) => theme.spacing('s')},
    env(safe-area-inset-top, 0px)
  );
  padding-inline: max(
      ${({ theme }) => theme.spacing('base')},
      env(safe-area-inset-left, 0px)
    )
    max(
      ${({ theme }) => theme.spacing('base')},
      env(safe-area-inset-right, 0px)
    );
  color: ${({ theme }) => theme.color('background', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  pointer-events: none;

  & > :first-child {
    justify-self: start;
  }

  & > :last-child {
    justify-self: end;
  }
`;
