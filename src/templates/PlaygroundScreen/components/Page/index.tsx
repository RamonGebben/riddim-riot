import styled from 'styled-components';

export const Page = styled.main`
  display: grid;
  gap: ${({ theme }) => theme.spacing('base')};
  max-inline-size: 110rem;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing('base')};
`;
