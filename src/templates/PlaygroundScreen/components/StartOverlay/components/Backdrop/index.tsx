import styled from 'styled-components';

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex('modal')};
  display: grid;
  place-content: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('s')};
  padding: ${({ theme }) => theme.spacing('base')};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.color('background')} 85%,
    transparent
  );
  text-align: center;
`;
