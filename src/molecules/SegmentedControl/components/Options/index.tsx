import styled from 'styled-components';

export const Options = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing('xxs')};
`;
