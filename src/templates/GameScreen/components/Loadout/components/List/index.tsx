import styled from 'styled-components';

export const List = styled.ol`
  position: fixed;
  inset-block-end: ${({ theme }) => theme.spacing('base')};
  inset-inline-start: ${({ theme }) => theme.spacing('base')};
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  pointer-events: none;
`;
