<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script module>
  let openedNavigationItems = $state(['tools']);
</script>

<script>
  import { version } from '$app/environment';
  import { page } from '$app/state';
  import { PUBLIC_GITHUB_LINK } from '$env/static/public';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { dialog, project } from '$lib/state';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { yarnBall } from '@lucide/lab';
  import {
    BookOpenTextIcon,
    ChevronDownIcon,
    CircleQuestionMarkIcon,
    CloudyIcon,
    ExternalLinkIcon,
    GalleryVerticalEndIcon,
    GiftIcon,
    GithubIcon,
    HeartIcon,
    Icon,
    MailIcon,
    NotebookPenIcon,
    RssIcon,
    ShieldAlertIcon,
    SquareTerminalIcon,
    SwatchBookIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import { untrack } from 'svelte';
  import LegacyMigrationError from './modals/LegacyMigrationError.svelte';
  import ArrowUp_0_1 from '@lucide/svelte/icons/arrow-up-0-1';

  // Set opened navigation items based on current page
  $effect(() => {
    page.route.id;
    untrack(() => {
      switch (page.route.id) {
        case '/':
        case '/yarn-colorway-finder':
        case '/yarn':
        case '/weather':
          if (!openedNavigationItems.includes('tools'))
            openedNavigationItems = [...openedNavigationItems, 'tools'];
          break;
        case '/gallery':
        case '/yarn-palette-gallery':
          if (!openedNavigationItems.includes('gallery'))
            openedNavigationItems = [...openedNavigationItems, 'gallery'];
          break;
        case '/faq':
        case '/contact':
        case '/privacy':
        case '/documentation':
        case '/changelog':
          if (!openedNavigationItems.includes('about'))
            openedNavigationItems = [...openedNavigationItems, 'about'];
          break;
        case '/supporters':
          if (!openedNavigationItems.includes(''))
            openedNavigationItems = [...openedNavigationItems, ''];
          break;
      }

      if (page.route.id?.includes('api')) {
        openedNavigationItems = [...openedNavigationItems, 'developer'];
      }

      if (page.route.id?.includes('/blog')) {
        if (!openedNavigationItems.includes('about'))
          openedNavigationItems = [...openedNavigationItems, 'about'];
      }
    });
  });
</script>

<div
  class="my-2 flex w-fit min-w-[278px] flex-col items-start justify-start gap-2 text-left lg:px-2"
  data-sveltekit-preload-data="hover"
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

  <div><ThemeSwitcher /></div>

  <a
    href="/supporters"
    class={[
      'btn hover:preset-tonal-surface-surface w-fit',
      page.url.pathname === '/supporters' && 'preset-tonal-secondary',
    ]}
  >
    <HeartIcon fill="#EE6E6C" color="#EE6E6C" />
    Supporters
  </a>

  {#snippet indicator()}
    <Accordion.ItemIndicator class="">
      <ChevronDownIcon
        class="h-5 w-5 transition group-data-[state=open]:rotate-180"
      />
    </Accordion.ItemIndicator>
  {/snippet}

  <Accordion
    value={openedNavigationItems}
    onValueChange={(e) => {
      openedNavigationItems = e.value;
    }}
    collapsible
    multiple
  >
    <Accordion.Item value="tools" class="group gap-0">
      <h3>
        <Accordion.ItemTrigger class="flex items-center justify-between">
          Tools
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>

      <Accordion.ItemContent class="flex w-full flex-col gap-2">
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} transition:safeSlide>
              <a
                href="/"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/' && 'preset-tonal-secondary',
                ]}
              >
                <NotebookPenIcon />
                Project Planner
              </a>

              <a
                href="/yarn-colorway-finder"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/yarn-colorway-finder' &&
                    'preset-tonal-secondary',
                ]}
              >
                <Icon iconNode={yarnBall} />
                Yarn Colorway Finder
              </a>

              <a
                href="/yarn"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/yarn' && 'preset-tonal-secondary',
                ]}
              >
                <SwatchBookIcon />
                Yarn Palette Creator
              </a>

              <a
                href="/weather"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/weather' && 'preset-tonal-secondary',
                ]}
              >
                <CloudyIcon />
                Weather Forecast
              </a>
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
    <Accordion.Item value="gallery" class="group gap-0">
      <h3>
        <Accordion.ItemTrigger class="flex items-center justify-between">
          Gallery
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent class="flex w-full flex-col gap-2">
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} transition:safeSlide>
              <a
                href="/gallery"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/gallery' && 'preset-tonal-secondary',
                ]}
              >
                <GalleryVerticalEndIcon />
                Projects
              </a>

              <a
                href="/yarn-palette-gallery"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/yarn-palette-gallery' &&
                    'preset-tonal-secondary',
                ]}
              >
                <SwatchBookIcon />
                Yarn Palettes</a
              >
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>

    <Accordion.Item value="about" class="group gap-0">
      <h3>
        <Accordion.ItemTrigger class="flex items-center justify-between">
          About
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent class="flex w-full flex-col gap-2">
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} transition:safeSlide>
              <a
                href="/faq"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/faq' && 'preset-tonal-secondary',
                ]}
              >
                <CircleQuestionMarkIcon />
                FAQ
              </a>

              <a
                href="/changelog"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/changelog' &&
                    'preset-tonal-secondary',
                ]}
              >
                <GiftIcon />
                What's New
              </a>

              <a
                href="/contact"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/contact' && 'preset-tonal-secondary',
                ]}
              >
                <MailIcon />
                Contact
              </a>

              <a
                href="/blog"
                class={[
                  'btn hover:preset-tonal-surface w-fit text-left',
                  (page.url.pathname === '/blog' ||
                    page.url.pathname.includes('/blog')) &&
                    'preset-tonal-secondary',
                ]}
              >
                <RssIcon /> Blog
              </a>

              <a
                href="/documentation"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/documentation' &&
                    'preset-tonal-secondary',
                ]}
              >
                <BookOpenTextIcon />
                Documentation
              </a>

              <a
                href="/privacy"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/privacy' && 'preset-tonal-secondary',
                ]}
              >
                <ShieldAlertIcon />
                Privacy
              </a>
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
    <Accordion.Item value="developer" class="group gap-0">
      <h3>
        <Accordion.ItemTrigger class="flex items-center justify-between">
          Developer
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent class="flex w-full flex-col gap-2">
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} transition:safeSlide>
              <a
                href="/api/yarn-colorways"
                class={[
                  'btn hover:preset-tonal-surface w-fit',
                  page.url.pathname === '/api/yarn-colorways' &&
                    'preset-tonal-secondary',
                ]}
              >
                <SquareTerminalIcon /> API
              </a>

              {#if PUBLIC_GITHUB_LINK}
                <a
                  href={PUBLIC_GITHUB_LINK}
                  class="btn hover:preset-tonal-surface w-fit"
                  target="_blank"
                >
                  <GithubIcon />
                  GitHub
                  <ExternalLinkIcon class="relative -top-[1px] size-5" />
                </a>
              {/if}
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion>

  <a
    class="btn hover:preset-tonal-surface w-fit opacity-50 hover:opacity-100"
    href="/changelog">v{version}</a
  >
</div>
