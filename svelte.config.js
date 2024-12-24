import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // compilerOptions: {
  //   compatibility: {
  //     componentApi: 4,
  //   },
  // },
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
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
          '/api',
          '/api/yarn-colorways',
          '/blog',
          '/blog/*',
          '/changelog',
          '/documentation',
          '/privacy',
          '/contact',
          '/faq',
          '/gallery',
          '/supporters',
          '/weather',
          '/yarn-colorway-finder',
          '/yarn-palette-gallery',
          '/yarn-search-request',
          '/yarn-search-request/*',
          '/yarn',
        ],
      },
    }),
    prerender: {
      entries: ['*'],
    },
    version: {
      name: pkg.version,
    },
  },
};

export default config;
