import styled from 'styled-components';

export const Weapons = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: ${({ theme }) => theme.fontFamily('mono')};

  & li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing('s')};
  }

  & kbd {
    color: ${({ theme }) => theme.color('secondary')};
    font: inherit;
  }
`;
