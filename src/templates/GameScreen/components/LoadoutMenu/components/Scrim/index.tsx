import styled from 'styled-components';

/**
 * Dims the frozen level behind the sheet. The sheet hangs from near the
 * top rather than centring: picking and swapping change its height, and a
 * centred sheet would jump under the player's eye as they do.
 */
export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex('modal')};
  display: grid;
  place-items: start center;
  padding: max(
      ${({ theme }) => theme.spacing('xs')},
      env(safe-area-inset-top, 0px),
      min(6vh, ${({ theme }) => theme.spacing('xl')})
    )
    max(${({ theme }) => theme.spacing('xs')}, env(safe-area-inset-right, 0px))
    max(${({ theme }) => theme.spacing('xs')}, env(safe-area-inset-bottom, 0px))
    max(${({ theme }) => theme.spacing('xs')}, env(safe-area-inset-left, 0px));
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 70%,
    transparent
  );
  backdrop-filter: blur(4px);
`;
