import styled from 'styled-components';

export const Hud = styled.header`
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: ${({ theme }) => theme.zIndex('sticky')};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing('base')};
  padding: ${({ theme }) => theme.spacing('s')}
    ${({ theme }) => theme.spacing('base')};
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
`;
