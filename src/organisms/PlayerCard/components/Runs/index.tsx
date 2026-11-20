import styled from 'styled-components';

/** Your best runs, best first. */
export const Runs = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xxs')};
  margin: 0;
  padding: 0;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;
  list-style: none;

  & li {
    display: grid;
    grid-template-columns: 1.5em 1fr auto;
    gap: ${({ theme }) => theme.spacing('xs')};
    color: ${({ theme }) => theme.color('background', 'text')};
  }

  & li > span:first-child,
  & li > span:last-child {
    color: ${({ theme }) => theme.color('secondary')};
  }

  & li > span:nth-child(2) {
    text-align: end;
  }
`;
