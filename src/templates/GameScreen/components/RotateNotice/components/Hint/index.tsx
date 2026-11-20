import styled, { keyframes } from 'styled-components';

const appear = keyframes`
  from { opacity: 0; }
  to { opacity: 0.7; }
`;

/**
 * Only shows once the notice has been up a while: a phone that turns at once
 * never sees it. The notice is hidden in landscape, which restarts the wait.
 */
export const Hint = styled.small`
  max-width: 24em;
  font-size: ${({ theme }) => theme.fontSize('s')};
  opacity: 0;
  animation: ${appear} 0.6s ease-out 4s forwards;
`;
