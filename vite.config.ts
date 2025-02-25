import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  esbuild: {
    supported: {
      'top-level-await': true, //browsers can handle top-level-await features
    },
  },
  plugins: [sveltekit(), tailwindcss()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});
