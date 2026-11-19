import styled from 'styled-components';

/** What the player can do right where they stand, above the hint. */
export const Prompt = styled.p.attrs({ role: 'status' })`
  position: fixed;
  inset-block-end: calc(
    ${({ theme }) => theme.spacing('l')} * 2.5 +
      env(safe-area-inset-bottom, 0px)
  );
  inset-inline: 0;
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  margin: 0;
  color: ${({ theme }) => theme.color('background', 'text')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('m')};
  text-align: center;
  pointer-events: none;

  & kbd {
    color: ${({ theme }) => theme.color('primary')};
    font: inherit;
  }
`;
