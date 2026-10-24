import { defineConfig } from 'vite';

export default defineConfig({
  // Keep production assets relative so the page works at /hugs/ or another host path.
  base: './',
});
