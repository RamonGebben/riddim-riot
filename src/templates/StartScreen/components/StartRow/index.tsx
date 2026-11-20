import styled from 'styled-components';

/** The button, with the key that does the same beside it. */
export const StartRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: inherit;
  gap: ${({ theme }) => theme.spacing('s')}
    ${({ theme }) => theme.spacing('base')};
`;
