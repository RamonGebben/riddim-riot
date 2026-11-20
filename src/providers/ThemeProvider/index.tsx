'use client';

import type { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import theme from '~/theme';
import { BaseStyle } from './components/BaseStyle';
import { ColorModeStyle } from './components/ColorModeStyle';
import { RootStyle } from './components/RootStyle';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <StyledThemeProvider theme={() => theme}>
      <ColorModeStyle />
      <RootStyle />
      <BaseStyle />
      {children}
    </StyledThemeProvider>
  );
};
