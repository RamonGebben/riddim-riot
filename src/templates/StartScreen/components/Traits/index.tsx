import styled from 'styled-components';

/** What a weapon does, in plain words. */
export const Traits = styled.span`
  color: ${({ theme }) => theme.color('secondary')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
