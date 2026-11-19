import styled from 'styled-components';

/**
 * Dims the frozen stage behind the panel, and scrolls when a short screen
 * can't fit it (the panel's auto margins centre it until then).
 */
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex('modal')};
  display: flex;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing('base')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 70%,
    transparent
  );
  backdrop-filter: blur(4px);
`;
