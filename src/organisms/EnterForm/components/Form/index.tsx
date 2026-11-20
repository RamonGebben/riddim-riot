import styled from 'styled-components';

export const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing('s')};
  inline-size: min(100%, 20rem);
  text-align: start;
`;
