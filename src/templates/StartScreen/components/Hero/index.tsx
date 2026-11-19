import styled from 'styled-components';

export const Hero = styled.section`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('base')};
  text-align: center;
`;
