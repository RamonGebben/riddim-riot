import styled from 'styled-components';

export const Section = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};
  justify-items: start;

  & p {
    margin: 0;
  }
`;
