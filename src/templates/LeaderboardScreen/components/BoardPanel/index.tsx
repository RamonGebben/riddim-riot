import styled from 'styled-components';

/** The board's pane of glass, named by a small label. */
export const BoardPanel = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing('s')};
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing('base')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 12%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 75%,
    transparent
  );
  backdrop-filter: blur(8px);

  & h2 {
    margin: 0;
    color: ${({ theme }) => theme.color('tertiary')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  & p {
    margin: 0;
    color: ${({ theme }) => theme.color('secondary')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-size: ${({ theme }) => theme.fontSize('s')};
  }
`;
