// Runs scripts/promo/export-promo-data.spec.ts with the app's Vite config
// (so #lib imports and .svelte.ts runes work). Not part of `pnpm test`.
import { defineConfig } from 'vitest/config';
import appConfig from '../../vite.config.ts';

export default defineConfig(async (env) => {
  const config = await (typeof appConfig === 'function'
    ? appConfig(env)
    : appConfig);
  return {
    ...config,
    test: {
      ...config.test,
      include: ['scripts/promo/export-promo-data.spec.ts'],
      exclude: [],
    },
  };
});
