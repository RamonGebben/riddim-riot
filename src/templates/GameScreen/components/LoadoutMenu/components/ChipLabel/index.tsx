import styled from 'styled-components';

/** An engine filter's face: its icon, its name and how many the bag holds. */
export const ChipLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')};
  white-space: nowrap;

  /* The engine reads at a glance, as on the cards. */
  & > svg {
    color: ${({ theme }) => theme.color('primary')};
    font-size: 1.35em;
  }

  [aria-pressed='true'] > & > svg {
    color: inherit;
  }

  & > [data-part='count'] {
    color: ${({ theme }) => theme.color('secondary')};
    font-family: ${({ theme }) => theme.fontFamily('mono')};
    font-variant-numeric: tabular-nums;
  }

  [aria-pressed='true'] > & > [data-part='count'] {
    color: inherit;
  }
`;
