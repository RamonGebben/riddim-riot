import styled from 'styled-components';

/** The run in numbers: a row of tiles that wraps on a narrow panel. */
export const Stats = styled.dl`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing('s')};
  margin: 0;
`;
