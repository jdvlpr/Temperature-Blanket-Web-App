import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import fs from 'node:fs';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env vars instead of just those with `VITE_`.
  const env = loadEnv(mode, process.cwd(), '');

  const certPath = env.PRIVATE_TAILSCALE_CRT_PATH;
  const keyPath = env.PRIVATE_TAILSCALE_KEY_PATH;
  const useHttps =
    certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath);

  return {
    server: {
      https: useHttps
        ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          }
        : undefined,
      host: true,
      hmr: useHttps
        ? {
            protocol: 'wss',
            host: env.PRIVATE_TAILSCALE_DOMAIN || 'localhost:5173',
          }
        : undefined,
    },
    esbuild: {
      supported: {
        'top-level-await': true,
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
  };
});
