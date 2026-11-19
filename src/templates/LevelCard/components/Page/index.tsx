import styled, { keyframes } from 'styled-components';

const rise = keyframes`
  from { transform: scale(0.94); }
  to { transform: scale(1); }
`;

export const Page = styled.main`
  display: grid;
  place-content: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('s')};
  box-sizing: border-box;
  min-block-size: 100vh;
  min-block-size: 100dvh;
  padding: ${({ theme }) => theme.spacing('base')};
  text-align: center;
  -webkit-user-select: none;
  user-select: none;
  animation: ${rise} 0.4s ease-out;
`;
