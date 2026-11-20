import styled from 'styled-components';

/**
 * Rank, totals and actions: stacked in a narrow card, side by side when
 * the card runs the width of the page as a strip.
 */
export const Body = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing('s')};

  @container place (min-width: 32rem) {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: ${({ theme }) => theme.spacing('l')};
  }
`;
