import styled from 'styled-components';

export const Page = styled.main`
  display: grid;
  place-content: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('m')};
  box-sizing: border-box;
  /* dvh: the height actually visible, with or without the browser's bars. */
  min-block-size: 100vh;
  min-block-size: 100dvh;
  padding: ${({ theme }) => theme.spacing('base')};
  text-align: center;
`;
