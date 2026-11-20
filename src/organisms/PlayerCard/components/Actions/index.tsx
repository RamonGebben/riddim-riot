import styled from 'styled-components';

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('s')};
  margin-block-start: ${({ theme }) => theme.spacing('xxs')};

  & button {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
  }
`;
