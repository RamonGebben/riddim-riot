import styled from 'styled-components';

/** The way home, over the page heading. */
export const Titles = styled.div`
  display: grid;
  justify-items: start;
  gap: ${({ theme }) => theme.spacing('xxs')};
`;
