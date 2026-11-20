import styled from 'styled-components';

/** Ranks skipped between the top and your neighbours. */
export const Gap = styled.tr`
  td {
    block-size: 1.5em;
    padding: 0 ${({ theme }) => theme.spacing('xs')};
    color: ${({ theme }) => theme.color('secondary')};
    letter-spacing: 0.3em;
  }
`;
