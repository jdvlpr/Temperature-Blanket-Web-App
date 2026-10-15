# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file is committed per branch on purpose: branches differ (e.g. `main` has no accounts code; `release/v7` does), so keep it describing what exists on _this_ branch. Workspace-wide notes (sibling iOS app and WordPress plugin, issue tracking) live in the parent folder's CLAUDE.md.

## Overview

[temperature-blanket.com](https://temperature-blanket.com): visualize a location's historical climate data, build a color "gauge" mapping temperature/weather to yarn colors, and preview a crochet/knitting temperature blanket pattern. Projects can be saved locally, shared as a URL, exported to PDF/CSV/PNG/Google Sheets, or published to the public gallery (backed by a headless WordPress site). With accounts on, projects, palettes and preferences also sync to the server.

Svelte 5 (runes) + SvelteKit 3 (config lives in `sveltekit({...})` in `vite.config.ts`; there is no `svelte.config.js`; imports use `#lib/...` with file extensions), Skeleton UI 5, Tailwind 4, TypeScript, deployed on Cloudflare Pages via `@sveltejs/adapter-cloudflare`. Package manager is **pnpm**.

## Setup

Copy `.env.example` to `.env`. Location search needs a free GeoNames username (`SECRET_GEONAMES_USERNAME`); weather data needs a free Meteostat/RapidAPI key (`SECRET_METEOSTAT_API_KEY`). Everything else is optional for local dev — POST requests to the WordPress backend are rejected locally without the auth key, which is expected. Guest gallery submissions and signed-out email sign-in also need `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` (Cloudflare's always-pass test site key), which pairs with the test secret in `wrangler.jsonc`.

## Commands

```bash
pnpm install
pnpm dev                 # dev server (vite)
pnpm dev:accounts        # dev server with the accounts UI on; sign-in codes at /api/dev/outbox?to=<email>
pnpm build               # production build — also generates Cloudflare _routes.json
pnpm preview

pnpm check               # svelte-kit sync + svelte-check
pnpm lint                # prettier --check + eslint
pnpm format

pnpm test                # unit + integration + e2e, in that order
pnpm test:unit           # vitest run src — colocated *.test.ts
pnpm test:integration    # boots a dev server, runs vitest against tests/integration (yarn colorway API)
pnpm test:e2e            # playwright, tests/end-to-end, against build+preview over HTTPS on localhost:4173
pnpm test:e2e:cloudflare # builds with accounts on, migrates local D1, runs tests/end-to-end + tests/cloudflare under `wrangler pages dev` (:8788)
pnpm db:migrate:local    # apply migrations/ to the local D1 database
```

`scripts/export-project-palettes.ts --wp <gallery URL> --out <file.json> [--verify]` exports gallery projects' palettes (read-only GraphQL) for the plugin's one-time `wp tempblanket import-palettes`; see its header.

Single unit test file: `pnpm vitest run src/lib/utils/color-utils.test.ts`. Single e2e spec: `pnpm playwright test tests/end-to-end/test-contact.spec.ts`. Playwright's webServer runs `build && preview` itself.

## Architecture

- **`src/lib/state/*.svelte.ts`** — global reactive state (runes), one per concern: `project-state`, `location-state`, `weather-state`, `gauges-state`, `page-state`, `preview-state`. `state/gauges/` holds per-gauge-type state (temperature, rain, snow, daytime, moon-phase). Gauges — weather variable → yarn color ranges — are the core domain concept.
- **`src/lib/storage/`** — client persistence: projects and palettes in IndexedDB (`idb-keyval`), preferences in Local Storage, `migration-manager.ts` migrates old stored shapes. Update the Local Storage/IndexedDB tables in `README.md` when adding or changing a stored key.
- **`src/lib/features/`** — self-contained features: `pdf/` (built from composable `sections/`), `google-sheets/`, `image-palette/`, `palette-image/`, `charts/`, `diagnostics/`, etc.
- **`src/routes/api/`** — server routes. `location/*` and `weather/v1/meteostat/*` proxy GeoNames/Meteostat to hide keys; `project/+server.ts` proxies anonymous gallery submissions to WordPress, only with a valid Cloudflare Turnstile token in the `CF-Turnstile-Response` header (`src/lib/server/turnstile.ts`; it fails closed, so no secret or a Siteverify outage refuses the submission; the widget is `src/lib/components/Turnstile.svelte`); `yarn-colorways/{v1,v3}/*` is a public, versioned yarn colorway API (documented at `/api/yarn-colorways`).
- **`src/lib/data/yarns/`** — static yarn/colorway data.
- Routes map roughly 1:1 to top-level nav (`weather`, `yarn`, `yarn-colorway-finder`, `gallery/[id]`, `globe`, `blog/*` dated folders, `my-projects`, `account`, docs pages). `src/routes/.dev-tools/` is dev-only (redirected away in production by `hooks.server.ts`).
- The Cloudflare adapter's `routes.exclude` (in `vite.config.ts`) controls which paths are static vs. hit a Function — keep API routes out of it; the free plan caps it at ~100 entries, so prefer `/*` wildcards.

### Accounts and sync

Accounts are behind flags and dormant in production until launch:

- `PUBLIC_ACCOUNTS_ENABLED=true` at **build time** includes the account UI (see `app.d.ts`, `vite.config.ts`).
- Server-side, `ACCOUNTS_ENABLED`, `SYNC_ENABLED`, `GALLERY_PUBLISH_ENABLED`, `ACCOUNTS_SIGNUP_LIMIT` and `BETTER_AUTH_SECRET` are Cloudflare bindings/vars. So is `TURNSTILE_SECRET_KEY`, which guest gallery submissions need even with accounts off (its site key, `PUBLIC_TURNSTILE_SITE_KEY`, is set at build time). `wrangler.jsonc` is **local-only** (no `pages_build_output_dir`); production values live in the Pages dashboard.
- `src/lib/server/cloudflare.ts`: `getPlatform()` returns the bindings (`env`), `ctx.waitUntil` and `caches` from `cloudflare:workers` — adapter-cloudflare 8 no longer sets `event.platform`, so server code calls this instead (undefined while building/prerendering).
- `src/lib/server/platform.ts`: `requireStorage()` returns 503 when the `DB` (D1) / `PROJECTS` (R2) bindings are missing; `/api/dev/*` routes exist only when `ENABLE_DEV_ROUTES=true` and otherwise 404.

Pieces:

- **Auth** — Better Auth (pinned version) in `src/lib/server/auth/`, mounted from `hooks.server.ts` at `/api/auth/*`. Email sign-in codes; `server/email/` sends via Resend, or a dev outbox locally. Client side in `src/lib/accounts/`. Resend's free plan is small, so email is kept to a minimum: Google is the main sign-in, a code request needs a Turnstile token unless it's for the signed-in account's own address, codes are limited per IP (`ACCOUNTS_CODE_LIMIT_PER_IP`) and per address, and `EMAIL_DAILY_LIMIT` caps Resend sends a day (every send goes through `sendEmail` in `auth/index.ts`). Better Auth routes that would email but aren't used are listed in `disabledPaths`.
- **Database** — D1 schema in `migrations/NNNN_*.sql`; add a new numbered file, never edit an applied one. Remote migrations are run by the owner, not by agents.
- **Sync** — `src/lib/sync/engine.ts` is a pure, fetch/IndexedDB-free sync pass (unit-tested against a fake server); `sync.svelte.ts` drives it. Server side: `src/lib/server/sync/` + `src/routes/api/sync/{changes,projects,palettes,preferences,trash}`. Project bodies go to R2, metadata to D1. Rules: optimistic revisions (stale save → 409); never lose data — on conflict the device copy becomes a new "(copy from this device…)" project; an edit beats a deletion; palettes and preferences are last-write-wins per item.
- **Gallery from accounts** — `src/lib/server/gallery/` (`/api/account/gallery`) publishes to WordPress on behalf of a signed-in user; guests still go through `/api/project`.

Server unit tests that need a database use `src/lib/server/test-d1.ts`, an in-memory D1 stand-in on `node:sqlite` with the migrations applied.

## Icons and fields

- Icons are sized by CSS tokens in `src/css/main.css`: `--icon-size` (1.25rem) for every icon, `--icon-size-sm` (1rem) via the `icon-sm` class for dropdown/row chevrons, external-link and other icons inline with text. Never use Lucide's `size` prop (CSS overrides it); use `icon-sm`, or a `size-*` class only for deliberately large icons (empty states, spinners). Icons in `btn-sm` are small automatically; Buttons, icon buttons and fields share one height, twice their text size plus `--spacing(1.5)` (40px at normal settings; `src/css/main.css`); `btn-icon` is that size as a circle, with an invisible tap area of at least 44px (its `::after`).
- Joined fields use `FIELD_GROUP`; an icon at the start of a select uses `FIELD_ICON` with `pl-11` on the select (`src/lib/constants/class-constants.ts`). Don't add `text-*` to `.input` (it changes its height); use Skeleton's `field-*` sizes.

## Testing conventions

- Unit tests are colocated next to the code as `*.test.ts`.
- `tests/integration/` hits real dev-server routes (yarn colorway API).
- Under `tests/cloudflare/`, give pages a test IP with `useTestIp()` (helpers.ts), never `setExtraHTTPHeaders`: Cloudflare refuses a `CF-Connecting-IP` header sent to its own sites, such as Turnstile's.
- `tests/end-to-end/test-*.spec.ts` run against the preview build; `tests/cloudflare/` covers accounts, sync and gallery routes and only runs under `pnpm test:e2e:cloudflare`.
- Optional HTTPS dev via a Tailscale cert/key (`PRIVATE_TAILSCALE_CRT_PATH`/`PRIVATE_TAILSCALE_KEY_PATH` in `.env`) for testing on other tailnet devices.
