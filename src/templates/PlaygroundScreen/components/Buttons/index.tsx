import styled from 'styled-components';

export const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing('xxs')};
`;
