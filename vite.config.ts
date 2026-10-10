import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import fs from 'node:fs';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

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
    preview: {
      https: useHttps
        ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          }
        : undefined,
      host: true,
      port: 4173,
    },
    esbuild: {
      supported: {
        'top-level-await': true,
      },
    },
    define: {
      // Off unless set at build time, so builds never fail for a missing variable
      __ACCOUNTS_ENABLED__: JSON.stringify(
        env.PUBLIC_ACCOUNTS_ENABLED === 'true',
      ),
    },
    plugins: [
      tailwindcss(),
      sveltekit({
        // Consult https://kit.svelte.dev/docs/integrations#preprocessors
        // for more information about preprocessors
        preprocess: vitePreprocess(),

        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        // adapter: adapter()
        adapter: adapter({
          // See below for an explanation of these options
          // Routes in exclude will not trigger cloudflare functions.
          // The free plan has a limit of 100,000 combined workers and page function requests,
          // so excluding routes helps to keep the number of requests within that limit.
          // Keep API routes out of this list. Also, a maximum of 100 items on this list,
          // so it's a good idea to use /* when you can.
          routes: {
            include: ['/*'],
            exclude: [
              '/_app/*',
              '/.DS_Store',
              '/.dev-tools/*',
              '/favicon.ico',
              '/favicon.png',
              '/images/*',
              '/manifest.json',
              '/robots.txt',
              '/service-worker.js',
              '/',
              '/account',
              '/api',
              '/api/yarn-colorways',
              '/auth/*',
              '/blog',
              '/blog/*',
              '/changelog',
              '/contact',
              '/contact/*',
              '/documentation',
              '/faq',
              '/gallery',
              '/globe',
              '/my-projects',
              '/privacy',
              '/supporters',
              '/weather',
              '/yarn',
              '/yarn-colorway-finder',
              '/yarn-search-request',
              '/yarn-search-request/*',
            ],
          },
        }),
        prerender: { entries: ['*'] },
        version: { name: pkg.version },
      }),
    ],
    test: {
      include: [
        'src/**/*.{test,spec}.{js,ts}',
        'tests/integration/**/*.{test,spec}.{js,ts}',
      ],
      exclude: ['tests/end-to-end/**/*.{test,spec}.{js,ts}'],
    },
  };
});
