import { defineConfig } from 'astro/config';

export default defineConfig({
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    shikiConfig: { themes: { light: 'github-light-default', dark: 'github-dark-default' } },
  },
});
