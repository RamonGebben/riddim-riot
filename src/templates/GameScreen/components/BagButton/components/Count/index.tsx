import styled, { keyframes } from 'styled-components';

/** Amber at first, settling to the pill's colour: a reward, briefly. */
const bump = keyframes`
  from {
    transform: scale(1.5);
    color: var(--pop);
  }
  to {
    transform: scale(1);
  }
`;

/** How many weapons the bag holds; it pops when one drifts in. */
export const Count = styled.span<{ $pops: boolean }>`
  --pop: ${({ theme }) => theme.color('quaternary')};
  display: inline-block;
  animation: ${({ $pops }) => ($pops ? bump : 'none')} 0.43s ease-out;

  :root[data-flashing='reduced'] & {
    animation: none;
  }
`;
