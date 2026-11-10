import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import fs from 'node:fs';
import { createRequire, register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'url';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

/**
 * adapter-cloudflare 8.0.0 points the built server's `cloudflare:workers` imports
 * back at the real module for the deployed Worker, in the same files `vite preview`
 * runs in Node, which can't load it. Under preview, they get the adapter's stand-in
 * again (bindings from wrangler.jsonc), as in dev.
 */
function previewCloudflareWorkers(): Plugin {
  return {
    name: 'preview-cloudflare-workers',
    enforce: 'pre',
    configurePreviewServer() {
      const adapterDir = new URL(
        '.',
        pathToFileURL(
          createRequire(import.meta.url).resolve(
            '@sveltejs/adapter-cloudflare/package.json',
          ),
        ),
      );
      const standIn = new URL('src/virtual-cloudflare-workers.js', adapterDir);
      const hook = `export async function resolve(specifier, context, next) {
        if (specifier === 'cloudflare:workers')
          return { url: ${JSON.stringify(standIn.href)}, shortCircuit: true };
        return next(specifier, context);
      }`;
      register(`data:text/javascript,${encodeURIComponent(hook)}`);
    },
  };
}

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
      // The beta at next.temperature-blanket.com: PUBLIC_SITE_CHANNEL=beta
      __SITE_BETA__: JSON.stringify(env.PUBLIC_SITE_CHANNEL === 'beta'),
    },
    plugins: [
      previewCloudflareWorkers(),
      tailwindcss(),
      sveltekit({
        inspector: true,
        // Consult https://kit.svelte.dev/docs/integrations#preprocessors
        // for more information about preprocessors
        preprocess: vitePreprocess(),

        // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
        // If your environment is not supported or you settled on a specific environment, switch out the adapter.
        // See https://kit.svelte.dev/docs/adapters for more information about adapters.
        // Built for Workers: wrangler.jsonc (local) and wrangler.production.jsonc
        // (deployed) both have `main` and `assets`. A request matching the root
        // _redirects or a file in the build (static files, prerendered pages) is
        // answered without running the Worker; everything else, the API included, runs it.
        // Never put a file at a path the Worker should answer (tests/cloudflare/test-routes.spec.ts).
        adapter: adapter(),
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
