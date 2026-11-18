import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { Playground } from '.';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root element');

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <Playground />
    </ThemeProvider>
  </StrictMode>,
);
