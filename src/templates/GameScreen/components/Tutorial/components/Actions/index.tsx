import styled from 'styled-components';

/** The first button (Skip, or Back at the end) to the left, the rest right. */
export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing('s')};

  & > :first-child {
    margin-inline-end: auto;
  }
`;
