import styled from 'styled-components';

export const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('s')};
  margin-block-start: ${({ theme }) => theme.spacing('xxs')};
`;
