import styled from 'styled-components';

/** An empty bag, said in a line where the cards would be. */
export const Empty = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing('s')} 0;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
