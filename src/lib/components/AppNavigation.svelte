<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import { version } from '$app/env';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { PUBLIC_GITHUB_LINK } from '$app/env/public';
  import PreferencesDialog from '#lib/components/modals/PreferencesDialog.svelte';
  import { SMALL_LINK, SMALL_LINKS } from '#lib/constants/class-constants.js';
  import { alignIconInk } from '#lib/state/attachments/align-icon-ink.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { yarnBall } from '@lucide/lab';
  import {
    CloudyIcon,
    ExternalLinkIcon,
    LibraryBigIcon,
    GlobeIcon,
    HeartIcon,
    Icon,
    LandmarkIcon,
    NotebookPenIcon,
    SlidersHorizontalIcon,
    SwatchBookIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import LegacyMigrationError from './modals/LegacyMigrationError.svelte';

  const pathname = $derived(page.url.pathname);
  const library = $derived(['/my-projects', '/my-palettes'].includes(pathname));
  const gallery = $derived(
    ['/gallery', '/gallery/palettes'].includes(pathname),
  );
  const blog = $derived(pathname.includes('/blog'));

  const LINK = 'btn hover:preset-tonal-surface w-fit';
  const CURRENT = 'preset-tonal-secondary';
  const HEADING =
    'text-surface-700-300 mt-4 px-3 text-xs font-semibold tracking-wide uppercase';
  const SMALL_CURRENT = 'text-secondary-700-300 opacity-100!';
</script>

<!-- Icons line up by what's drawn, with the site logo's edge -->
<nav
  aria-label="Site"
  class="my-2 flex w-fit min-w-[278px] flex-col items-start justify-start gap-1 text-left lg:pr-2 lg:pl-3"
  data-sveltekit-preload-data="hover"
  {@attach alignIconInk}
>
  {#if project.status.temporaryProjectsBackup && project.status.temporaryProjectsBackup.length && project.status.temporaryUid}
    <!--Access backups for project storage migration error, added in version 5.35.0 -->
    <button
      class="btn preset-filled-error-500"
      onclick={() => {
        dialog.trigger({
          type: 'component',
          component: {
            ref: LegacyMigrationError,
            props: {
              uid: project.status.temporaryUid,
            },
          },
          options: {
            size: 'large',
          },
        });
      }}><TriangleAlertIcon /> Save Your Projects</button
    >
  {/if}

  <a
    href={resolve('my-projects')}
    class={[LINK, library && CURRENT]}
    aria-current={library ? 'page' : undefined}
  >
    <LibraryBigIcon />
    My Library
  </a>

  <button
    class="btn hover:preset-tonal-surface"
    onclick={() =>
      dialog.trigger({
        component: {
          ref: PreferencesDialog,
        },
        type: 'component',
        options: { title: 'Preferences' },
      })}
  >
    <SlidersHorizontalIcon />
    My Preferences
  </button>

  <a
    href="/supporters"
    class={[LINK, pathname === '/supporters' && CURRENT]}
    aria-current={pathname === '/supporters' ? 'page' : undefined}
  >
    <HeartIcon fill="#EE6E6C" color="#EE6E6C" />
    Supporters
  </a>

  <h2 class={HEADING}>Create</h2>

  <a
    href="/"
    class={[LINK, pathname === '/' && CURRENT]}
    aria-current={pathname === '/' ? 'page' : undefined}
  >
    <NotebookPenIcon />
    Project Planner
  </a>

  <a
    href="/yarn"
    class={[LINK, pathname === '/yarn' && CURRENT]}
    aria-current={pathname === '/yarn' ? 'page' : undefined}
  >
    <SwatchBookIcon />
    Yarn Palette Creator
  </a>

  <h2 class={HEADING}>Explore</h2>

  <a
    href="/gallery"
    class={[LINK, gallery && CURRENT]}
    aria-current={gallery ? 'page' : undefined}
  >
    <LandmarkIcon />
    Gallery
  </a>

  <a
    href="/globe"
    class={[LINK, pathname === '/globe' && CURRENT]}
    aria-current={pathname === '/globe' ? 'page' : undefined}
  >
    <GlobeIcon />
    Globe
  </a>

  <a
    href="/yarn-colorway-finder"
    class={[LINK, pathname === '/yarn-colorway-finder' && CURRENT]}
    aria-current={pathname === '/yarn-colorway-finder' ? 'page' : undefined}
  >
    <Icon iconNode={yarnBall} />
    Yarn Colorway Finder
  </a>

  <a
    href="/weather"
    class={[LINK, pathname === '/weather' && CURRENT]}
    aria-current={pathname === '/weather' ? 'page' : undefined}
  >
    <CloudyIcon />
    Weather Forecast
  </a>

  <!-- Small links, spaced apart in one row that wraps. It takes the
  sidebar's width rather than setting it, or the sidebar would stretch to
  fit every link on one line -->
  <div class={[SMALL_LINKS, 'mt-6 w-0 min-w-full px-3']}>
    <a
      href="/faq"
      class={['py-1', SMALL_LINK, pathname === '/faq' && SMALL_CURRENT]}
      aria-current={pathname === '/faq' ? 'page' : undefined}>FAQ</a
    >
    <a
      href="/blog"
      class={['py-1', SMALL_LINK, blog && SMALL_CURRENT]}
      aria-current={blog ? 'page' : undefined}>Blog</a
    >
    <a
      href="/documentation"
      class={[
        'py-1',
        SMALL_LINK,
        pathname === '/documentation' && SMALL_CURRENT,
      ]}
      aria-current={pathname === '/documentation' ? 'page' : undefined}
      >Documentation</a
    >
    <a
      href="/changelog"
      class={['py-1', SMALL_LINK, pathname === '/changelog' && SMALL_CURRENT]}
      aria-current={pathname === '/changelog' ? 'page' : undefined}
    >
      What's New <span class="text-xs">v{version}</span>
    </a>
    <a
      href="/contact"
      class={['py-1', SMALL_LINK, pathname === '/contact' && SMALL_CURRENT]}
      aria-current={pathname === '/contact' ? 'page' : undefined}>Contact</a
    >
    <a
      href="/privacy"
      class={['py-1', SMALL_LINK, pathname === '/privacy' && SMALL_CURRENT]}
      aria-current={pathname === '/privacy' ? 'page' : undefined}>Privacy</a
    >
    <a
      href="/api/yarn-colorways"
      class={[
        'py-1',
        SMALL_LINK,
        pathname === '/api/yarn-colorways' && SMALL_CURRENT,
      ]}
      aria-current={pathname === '/api/yarn-colorways' ? 'page' : undefined}
      >API</a
    >
    {#if PUBLIC_GITHUB_LINK}
      <a
        href={PUBLIC_GITHUB_LINK}
        class={['inline-flex items-center gap-1 py-1', SMALL_LINK]}
        target="_blank"
        rel="noopener"
      >
        GitHub
        <ExternalLinkIcon class="icon-sm" aria-hidden="true" />
        <span class="sr-only">(opens in a new tab)</span>
      </a>
    {/if}
  </div>
</nav>
