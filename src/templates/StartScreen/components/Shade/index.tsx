import styled from 'styled-components';

/** Darkens the backdrop under the text, lighter at the edges. */
export const Shade = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(
      ellipse at 50% 35%,
      color-mix(
          in srgb,
          ${({ theme }) => theme.color('background')} 70%,
          transparent
        )
        0%,
      color-mix(
          in srgb,
          ${({ theme }) => theme.color('background')} 35%,
          transparent
        )
        70%
    ),
    linear-gradient(
      to bottom,
      transparent 40%,
      color-mix(
        in srgb,
        ${({ theme }) => theme.color('background')} 85%,
        transparent
      )
    );
  pointer-events: none;
`;
