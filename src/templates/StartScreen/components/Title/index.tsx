import styled, { keyframes } from 'styled-components';

/** The glow breathes at the tempo: two beats at 140 BPM. */
const breathe = keyframes`
  0%, 100% { filter: drop-shadow(0 0 18px rgb(167 139 250 / 0.55)); }
  12% { filter: drop-shadow(0 0 34px rgb(96 165 250 / 0.9)); }
`;

export const Title = styled.h1`
  margin: 0;
  background: ${({ theme }) => theme.gradient('hero')};
  background-clip: text;
  color: transparent;
  font-family: ${({ theme }) => theme.fontFamily('heading')};
  /* Sized by the short side too, so a landscape phone keeps the button in view. */
  font-size: clamp(2.75rem, min(10vw, 16vh), 6rem);
  font-weight: 900;
  font-style: italic;
  line-height: 0.95;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  text-wrap: balance;
  animation: ${breathe} ${(60 / 140) * 2}s ease-out infinite;

  :root[data-flashing='reduced'] & {
    animation: none;
  }
`;
