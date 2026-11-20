import styled from 'styled-components';

/** Ranks down the side, totals right-aligned in fixed-width figures. */
export const Table = styled.table`
  inline-size: 100%;
  border-collapse: collapse;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;
  /* Read as columns even inside a centred panel. */
  text-align: start;

  th {
    padding: 0 ${({ theme }) => theme.spacing('xs')}
      ${({ theme }) => theme.spacing('xxs')};
    color: ${({ theme }) => theme.color('tertiary')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
    letter-spacing: 0.2em;
    text-align: start;
  }

  th[data-align='end'] {
    text-align: end;
  }
`;
