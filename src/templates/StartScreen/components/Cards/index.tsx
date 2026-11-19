import styled from 'styled-components';

export const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: ${({ theme }) => theme.spacing('base')};
  inline-size: min(100%, 62rem);
`;
