import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import base from '@pindakaasman/eslint-config';
import storybook from '@pindakaasman/eslint-config/storybook';

export default defineConfig([
  ...base,
  ...storybook,
  { languageOptions: { globals: globals.browser } },
  globalIgnores(['dist/**', 'playwright-report/**', 'test-results/**']),
]);
