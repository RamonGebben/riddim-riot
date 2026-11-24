import styled from 'styled-components';

/**
 * A grid of weapon cards: three slots across, or the bag's rows, each
 * card with its bin beside it.
 */
export const Shelf = styled.ol<{ $columns?: number }>`
  display: grid;
  grid-template-columns: ${({ $columns }) =>
    $columns
      ? `repeat(${$columns}, minmax(0, 1fr))`
      : 'repeat(auto-fill, minmax(12.5em, 1fr))'};
  gap: ${({ theme }) => theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};

  & > li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: ${({ theme }) => theme.spacing('xxs')};
  }
`;
