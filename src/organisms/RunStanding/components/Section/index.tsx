import styled from 'styled-components';

/** The board's part of a run-end panel, under the run's own stats. */
export const Section = styled.section`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing('s')};
  inline-size: min(100%, 24rem);
`;
