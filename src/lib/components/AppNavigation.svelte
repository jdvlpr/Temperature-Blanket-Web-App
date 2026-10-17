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
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import { SMALL_LINK, SMALL_LINKS } from '#lib/constants/class-constants.js';
  import { alignIconInk } from '#lib/state/attachments/align-icon-ink.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { version } from '$app/env';
  import { PUBLIC_GITHUB_LINK } from '$app/env/public';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { yarnBall } from '@lucide/lab';
  import {
    ChevronDownIcon,
    CloudyIcon,
    ExternalLinkIcon,
    HeartIcon,
    Icon,
    LandmarkIcon,
    NotebookPenIcon,
    ThermometerSunIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import LegacyMigrationError from './modals/LegacyMigrationError.svelte';
  import { whatsNew } from '#lib/storage/whats-new.svelte.js';
  import { onMount } from 'svelte';

  const pathname = $derived(page.url.pathname);
  const gallery = $derived(
    ['/gallery', '/gallery/palettes'].includes(pathname),
  );
  const blog = $derived(pathname.includes('/blog'));
  const create = $derived(['/', '/yarn'].includes(pathname));

  const LINK = 'btn hover:preset-tonal-surface w-fit';
  const CURRENT = 'preset-tonal-secondary';
  const HEADING =
    'text-surface-700-300 mt-4 px-3 text-xs font-semibold tracking-wide uppercase';
  const CREATE_OPTIONS = [
    {
      href: '/',
      label: 'Project',
      description: 'Plan a blanket from weather data',
      yarn: false,
    },
    {
      href: '/yarn',
      label: 'Palette',
      description: 'Just pick yarn colors',
      yarn: true,
    },
  ];
  const SMALL_CURRENT = 'text-secondary-700-300 opacity-100!';

  // After loading, so the server's page (which can't know) doesn't differ
  let mounted = $state(false);
  onMount(() => (mounted = true));
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

  <!-- Always asks which to make -->
  <Menu
    positioning={menuPositioning('bottom-start')}
    onSelect={(details) => goto(details.value)}
  >
    <Menu.Trigger
      class={[LINK, create && CURRENT]}
      aria-current={create ? 'page' : undefined}
    >
      <NotebookPenIcon />
      Create
      <ChevronDownIcon class="icon-sm" aria-hidden="true" />
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={menuContentClass}>
          {#each CREATE_OPTIONS as option (option.href)}
            <Menu.Item value={option.href} class={menuItemClass}>
              {#if option.yarn}
                <Icon iconNode={yarnBall} class="shrink-0" aria-hidden="true" />
              {:else}
                <ThermometerSunIcon class="shrink-0" aria-hidden="true" />
              {/if}
              <div class="flex min-w-0 flex-col text-left">
                <span>{option.label}</span>
                <span class="text-surface-700-300 text-xs"
                  >{option.description}</span
                >
              </div>
            </Menu.Item>
          {/each}
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>

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
    href="/yarn-colorway-finder"
    class={[LINK, pathname === '/yarn-colorway-finder' && CURRENT]}
    aria-current={pathname === '/yarn-colorway-finder' ? 'page' : undefined}
  >
    <Icon iconNode={yarnBall} />
    Yarn Colorways
  </a>

  <a
    href="/weather"
    class={[LINK, pathname === '/weather' && CURRENT]}
    aria-current={pathname === '/weather' ? 'page' : undefined}
  >
    <CloudyIcon />
    Weather Forecast
  </a>

  <a
    href="/supporters"
    class={[LINK, pathname === '/supporters' && CURRENT, 'mt-4']}
    aria-current={pathname === '/supporters' ? 'page' : undefined}
  >
    <HeartIcon fill="#EE6E6C" color="#EE6E6C" />
    Supporters
  </a>

  <!-- Small links, spaced apart in one row that wraps. It takes the
  sidebar's width rather than setting it, or the sidebar would stretch to
  fit every link on one line -->
  <div class={[SMALL_LINKS, 'w-0 min-w-full px-3']}>
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
      What's New
      <!-- Filled while there's news to see -->
      <span
        class={[
          'badge px-2 py-0.5 text-xs',
          mounted && whatsNew.show
            ? 'preset-filled-primary-500'
            : 'bg-surface-200-800',
        ]}
        >v{version}{#if mounted && whatsNew.show}<span class="sr-only"
            >, new</span
          >{/if}</span
      >
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
