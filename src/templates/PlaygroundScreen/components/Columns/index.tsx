import styled from 'styled-components';

/** Listening controls on the left, stay in view; the design on the right. */
export const Columns = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing('base')};
  align-items: start;

  ${({ theme }) => theme.mq.greaterThan('tabletLandscape')`
    grid-template-columns: minmax(20rem, 26rem) 1fr;

    & > :first-child {
      position: sticky;
      inset-block-start: ${theme.spacing('base')};
    }
  `}
`;
