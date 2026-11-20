import styled from 'styled-components';

/** The run's settings, quiet under the meta line. */
export const Options = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: inherit;
  gap: ${({ theme }) => theme.spacing('xs')}
    ${({ theme }) => theme.spacing('l')};
`;
