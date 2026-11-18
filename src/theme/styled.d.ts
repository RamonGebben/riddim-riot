import 'styled-components';
import type theme from '.';

type Theme = typeof theme;

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- module augmentation has to be an interface
  export interface DefaultTheme extends Theme {}
}
