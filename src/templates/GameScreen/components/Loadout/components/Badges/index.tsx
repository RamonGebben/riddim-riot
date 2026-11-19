import styled from 'styled-components';

export const Badges = styled.span`
  grid-area: badges;
  display: flex;
  gap: 2px;
  justify-self: end;
  color: ${({ theme }) => theme.color('tertiary')};
  font-size: ${({ theme }) => theme.fontSize('base')};
`;
