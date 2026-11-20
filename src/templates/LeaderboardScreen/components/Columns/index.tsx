import styled from 'styled-components';

/**
 * The board, with your place beside it. Narrower, the place sits above
 * the board as a strip, so it's seen before the scroll.
 */
export const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: ${({ theme }) => theme.spacing('base')};

  @media (min-width: 860px) {
    grid-template-columns: minmax(0, 1fr) 17rem;

    & > :last-child {
      position: sticky;
      inset-block-start: ${({ theme }) => theme.spacing('base')};
    }
  }

  @media (max-width: 859px) {
    & > :last-child {
      order: -1;
    }
  }
`;
