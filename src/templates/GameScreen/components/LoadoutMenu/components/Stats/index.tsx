import styled from 'styled-components';

/**
 * A weapon's numbers, each with how it compares: amber where the pick
 * does better (a reward), grey where it does worse.
 */
export const Stats = styled.dl`
  grid-area: stats;
  display: grid;
  grid-template-columns: repeat(3, max-content);
  justify-content: start;
  align-items: baseline;
  gap: 2px ${({ theme }) => theme.spacing('xs')};
  margin: ${({ theme }) => theme.spacing('xxs')} 0 0;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-variant-numeric: tabular-nums;

  & > div {
    display: contents;
  }

  & dt {
    color: ${({ theme }) => theme.color('secondary')};
  }

  & dd {
    margin: 0;
    font-weight: ${({ theme }) => theme.fontWeight('bold')};
    text-align: end;
    min-inline-size: 3ch;
  }

  & [data-delta='up'] {
    color: ${({ theme }) => theme.color('quaternary')};
  }

  /* Worse is said plainly, in the text colour, not dimmed like a label. */
  & [data-delta='down'] {
    color: ${({ theme }) => theme.color('background', 'text')};
    font-weight: ${({ theme }) => theme.fontWeight('regular')};
  }

  /* The headline number leads, a step up and set apart. */
  & > div:first-child > * {
    padding-block-end: ${({ theme }) => theme.spacing('xxs')};
  }

  & > div:first-child > dd:first-of-type {
    font-size: ${({ theme }) => theme.fontSize('base')};
  }
`;
