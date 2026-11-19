import styled from 'styled-components';

/** A dark glass card behind a cluster of HUD readouts. */
export const HudPanel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('s')};
  padding: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('s')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 12%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('base')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 70%,
    transparent
  );
  backdrop-filter: blur(6px);
  pointer-events: auto;
`;
