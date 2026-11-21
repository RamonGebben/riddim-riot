import base from './playwright.config';
export default {
  ...base,
  use: { ...base.use, baseURL: 'http://localhost:3000' },
  webServer: {
    ...base.webServer,
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
};
