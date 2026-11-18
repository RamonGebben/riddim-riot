import styled from 'styled-components';

export const Pips = styled.span`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing('xxs')};
  color: ${({ theme }) => theme.color('error')};
  font-size: ${({ theme }) => theme.fontSize('base')};
  letter-spacing: 0.1em;
`;
