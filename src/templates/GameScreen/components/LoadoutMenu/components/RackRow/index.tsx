import styled from 'styled-components';

/**
 * One weapon as a track in the comparison: who it is, its bar of steps,
 * and its damage a bar - the pick's row over the slot's, on one grid.
 * The row being heard lights its label.
 */
export const RackRow = styled.div<{ $sounding: boolean }>`
  display: grid;
  /* Fixed columns, so both rows' steps fall on the same grid. */
  grid-template-columns: 5.5em 1.4em minmax(0, 1fr) minmax(6rem, 12rem) 8.5em;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xs')};
  min-block-size: ${({ theme }) => theme.minTarget()};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;

  & > [data-part='label'] {
    color: ${({ theme, $sounding }) =>
      $sounding ? theme.color('primary') : theme.color('tertiary')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  & > [data-part='engine'] {
    color: ${({ theme }) => theme.color('primary')};
    font-size: ${({ theme }) => theme.fontSize('m')};
  }

  & > [data-part='name'] {
    overflow: hidden;
    font-family: ${({ theme }) => theme.fontFamily('base')};
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & > [data-part='damage'] {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing('xxs')};
    justify-self: end;
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
  }

  @media (max-width: 479px) {
    grid-template-columns: 5.5em 1.4em minmax(0, 1fr) 7.5em;

    & > [data-part='name'] {
      display: none;
    }
  }
`;
