import styled from 'styled-components';

export const Card = styled.section`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing('s')};
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
    font-size: ${({ theme }) => theme.fontSize('s')};
  }
`;
