import styled from 'styled-components';

export const Page = styled.main`
  position: relative;
  z-index: 1;
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing('l')};
  box-sizing: border-box;
  inline-size: min(100%, 60rem);
  min-block-size: 100vh;
  min-block-size: 100dvh;
  margin-inline: auto;
  padding: ${({ theme }) => theme.spacing('l')}
    max(
      ${({ theme }) => theme.spacing('base')},
      env(safe-area-inset-right, 0px)
    )
    max(${({ theme }) => theme.spacing('xl')}, env(safe-area-inset-bottom, 0px))
    max(${({ theme }) => theme.spacing('base')}, env(safe-area-inset-left, 0px));

  @media (max-height: 500px) {
    gap: ${({ theme }) => theme.spacing('base')};
    padding-block-start: ${({ theme }) => theme.spacing('base')};
  }
`;
