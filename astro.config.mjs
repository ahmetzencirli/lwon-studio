import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ahmetzencirli.github.io',
  base: '/lwon-studio',
  trailingSlash: 'ignore',
  build: { format: 'file' },
  markdown: {
    shikiConfig: { themes: { light: 'github-light-default', dark: 'github-dark-default' } },
  },
});
