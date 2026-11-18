import styled from 'styled-components';

export const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing('s')};
`;
