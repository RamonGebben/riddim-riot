import styled from 'styled-components';

export const Page = styled.main`
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('xl')};
  box-sizing: border-box;
  min-block-size: 100vh;
  /* dvh: the height actually visible, with or without the browser's bars. */
  min-block-size: 100dvh;
  padding: ${({ theme }) => theme.spacing('l')}
    max(
      ${({ theme }) => theme.spacing('base')},
      env(safe-area-inset-right, 0px)
    )
    ${({ theme }) => theme.spacing('l')}
    max(${({ theme }) => theme.spacing('base')}, env(safe-area-inset-left, 0px));
`;
