import styled from 'styled-components';

/** Dims the frozen stage behind the panel. */
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex('modal')};
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing('base')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 70%,
    transparent
  );
  backdrop-filter: blur(4px);
`;
