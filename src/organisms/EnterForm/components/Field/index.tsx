import styled from 'styled-components';

/** A label over its input, and any problem under it. */
export const Field = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xxs')};
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
