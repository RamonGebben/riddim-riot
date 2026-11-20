import styled from 'styled-components';

/** Points, runs and best run: rows in a narrow card, columns in a strip. */
export const Totals = styled.dl`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xxs')};
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;

  & div {
    display: flex;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing('base')};
  }

  & dt {
    color: ${({ theme }) => theme.color('secondary')};
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  & dd {
    margin: 0;
    color: ${({ theme }) => theme.color('background', 'text')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
  }

  @container place (min-width: 32rem) {
    grid-auto-flow: column;
    justify-content: start;
    gap: ${({ theme }) => theme.spacing('l')};

    & div {
      flex-direction: column;
      gap: 0;
    }
  }
`;
