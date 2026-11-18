import styled from 'styled-components';

export const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: ${({ theme }) => theme.spacing('xxs')};
  padding: ${({ theme }) => theme.spacing('xs')};
`;
