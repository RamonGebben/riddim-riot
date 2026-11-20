import styled from 'styled-components';

/** One weapon: its icon large, its name and what it does beside it. */
export const Weapon = styled.li`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: ${({ theme }) => theme.spacing('s')};

  & > svg {
    grid-row: span 2;
    color: ${({ theme }) => theme.color('primary')};
    font-size: ${({ theme }) => theme.fontSize('l')};
  }

  & strong {
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.5em;
    font-size: ${({ theme }) => theme.fontSize('base')};
    line-height: ${({ theme }) => theme.lineHeight('tight')};
  }
`;
