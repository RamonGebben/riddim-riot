import styled from 'styled-components';

/** A slider and its number box side by side. */
export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xs')};
`;
