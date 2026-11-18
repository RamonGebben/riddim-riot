import styled from 'styled-components';

export const Page = styled.main`
  display: grid;
  place-content: center;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('m')};
  min-block-size: 100vh;
  padding: ${({ theme }) => theme.spacing('base')};
  text-align: center;
`;
