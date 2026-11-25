import styled from 'styled-components';

/** The run, your best, and where that puts you. */
export const Tally = styled.dl`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('l')};
  margin: 0;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-variant-numeric: tabular-nums;

  div {
    display: grid;
    justify-items: center;
  }

  dt {
    color: ${({ theme }) => theme.color('secondary')};
    font-size: ${({ theme }) => theme.fontSize('s')};
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    color: ${({ theme }) => theme.color('background', 'text')};
    font-size: ${({ theme }) => theme.fontSize('m')};
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
  }
`;
