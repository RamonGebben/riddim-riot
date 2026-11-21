import styled from 'styled-components';

/** The bag's label on the left, its sort order on the right. */
export const SortRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing('xs')};

  & fieldset {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing('xs')};
  }

  & legend {
    float: left;
    margin: 0;
  }
`;
