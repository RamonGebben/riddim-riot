import styled from 'styled-components';

/** Wordmarks this short stay stacked down to a landscape phone's height. */
export const STACKED = '(min-height: 32rem)';

export const Heading = styled.h1`
  display: inline-block;
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
  white-space: nowrap;
  filter: drop-shadow(0 0 18px rgb(167 139 250 / 0.55));

  @media ${STACKED} {
    font-size: clamp(3.5rem, min(16vw, 18vh), 6rem);
  }
`;
