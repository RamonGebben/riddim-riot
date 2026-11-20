import styled from 'styled-components';

export const WeaponList = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.spacing('s')};
  margin: 0;
  padding: 0;
  list-style: none;
`;
