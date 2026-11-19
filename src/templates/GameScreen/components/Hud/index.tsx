import styled from 'styled-components';

export const Hud = styled.header`
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing('base')};
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
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
