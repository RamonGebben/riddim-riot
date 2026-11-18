import styled from 'styled-components';

/** Sits over the stage's canvas, out of the way of the trigger. */
export const Hint = styled.p`
  position: absolute;
  inset-block-end: ${({ theme }) => theme.spacing('l')};
  inset-inline: 0;
  margin: 0;
  text-align: center;
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('m')};
  pointer-events: none;
`;
