import { createGlobalStyle } from 'styled-components';

export const BaseStyle = createGlobalStyle`
  body {
    margin: 0;
    background: ${({ theme }) => theme.color('background')};
    color: ${({ theme }) => theme.color('background', 'text')};
    font-family: ${({ theme }) => theme.fontFamily('base')};
    line-height: ${({ theme }) => theme.lineHeight('base')};
  }
`;
