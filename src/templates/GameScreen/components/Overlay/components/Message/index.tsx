import styled from 'styled-components';

/** A plain sentence, for a panel that explains rather than scores. */
export const Message = styled.p`
  margin: 0;
  max-inline-size: 36ch;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('base')};
`;
