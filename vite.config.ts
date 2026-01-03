import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    supported: {
      'top-level-await': true, //browsers can handle top-level-await features
    },
  },
  plugins: [tailwindcss(), sveltekit()],
  test: {
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'tests/integration/**/*.{test,spec}.{js,ts}',
    ],
    exclude: ['tests/end-to-end/**/*.{test,spec}.{js,ts}'],
  },
});
