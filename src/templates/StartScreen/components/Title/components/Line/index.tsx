import styled from 'styled-components';
import { STACKED } from '../Heading';

/**
 * One word of the mark. Stacked, RIDDIM sets smaller and wider-spaced so
 * it spans the same width as RIOT; on a short screen the two share a line.
 */
export const Line = styled.span<{ $lead?: boolean }>`
  display: inline;

  @media ${STACKED} {
    display: block;
    ${({ $lead }) =>
      $lead &&
      `
        font-size: 0.62em;
        letter-spacing: 0.06em;
        margin-inline-end: -0.06em;
      `}
  }
`;
