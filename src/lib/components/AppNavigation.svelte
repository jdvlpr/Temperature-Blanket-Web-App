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
  import { page } from '$app/state';
  import { PUBLIC_GITHUB_LINK } from '$env/static/public';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { yarnBall } from '@lucide/lab';
  import {
    BookOpenTextIcon,
    CircleHelpIcon,
    CloudIcon,
    ExternalLinkIcon,
    FileClockIcon,
    GalleryHorizontalEndIcon,
    GalleryVerticalEndIcon,
    GithubIcon,
    History,
    HistoryIcon,
    Icon,
    MailIcon,
    MessageCirclePlusIcon,
    NotebookPenIcon,
    RssIcon,
    ShieldAlertIcon,
    SquareTerminalIcon,
    SwatchBookIcon,
  } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';

  $effect(() => {
    switch (page.route.id) {
      case '/':
      case '/yarn-colorway-finder':
      case '/yarn':
      case '/weather':
        openedNavigationItems = ['tools'];
        break;
      case '/gallery':
      case '/yarn-palette-gallery':
        openedNavigationItems = ['gallery'];
        break;
      case '/faq':
      case '/contact':
      case '/yarn-search-request':
      case '/privacy':
      case '/documentation':
      case '/changelog':
        openedNavigationItems = ['information'];
        break;
      case '/supporters':
        openedNavigationItems = [''];
        break;
    }

    if (page.route.id?.includes('/blog') || page.route.id?.includes('/api')) {
      openedNavigationItems = ['information'];
    }
  });
</script>

<div
  class="my-2 flex w-fit flex-col items-start justify-start gap-2 text-left lg:px-2"
  data-sveltekit-preload-data="hover"
>
  <div><ThemeSwitcher /></div>

  <Accordion
    value={openedNavigationItems}
    onValueChange={(e) => {
      openedNavigationItems = e.value;
    }}
    collapsible
  >
    {#snippet iconOpen()}<svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-4"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m4.5 15.75 7.5-7.5 7.5 7.5"
        />
      </svg>
    {/snippet}
    {#snippet iconClosed()}<svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="size-4"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m19.5 8.25-7.5 7.5-7.5-7.5"
        />
      </svg>
    {/snippet}
    <Accordion.Item value="tools" controlHover="hover:preset-tonal">
      {#snippet control()}
        Tools
      {/snippet}
      {#snippet panel()}
        <div class="flex w-full flex-col gap-2">
          <a
            href="/"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/' && 'preset-tonal-secondary',
            ]}
          >
            <NotebookPenIcon />
            Project Planner
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/yarn-colorway-finder"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/yarn-colorway-finder' &&
                'preset-tonal-secondary',
            ]}
          >
            <Icon iconNode={yarnBall} />
            Yarn Colorway Finder
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/yarn"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/yarn' && 'preset-tonal-secondary',
            ]}
          >
            <SwatchBookIcon />
            Yarn Palette Creator
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/weather"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/weather' && 'preset-tonal-secondary',
            ]}
          >
            <CloudIcon />
            Weather Forecast
          </a>
        </div>
      {/snippet}
    </Accordion.Item>
    <Accordion.Item value="gallery" controlHover="hover:preset-tonal">
      {#snippet control()}
        Gallery
      {/snippet}
      {#snippet panel()}
        <div class="flex w-full flex-col gap-2">
          <a
            href="/gallery"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/gallery' && 'preset-tonal-secondary',
            ]}
          >
            <GalleryVerticalEndIcon />
            Projects
          </a>

          <a
            href="/yarn-palette-gallery"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/yarn-palette-gallery' &&
                'preset-tonal-secondary',
            ]}
          >
            <SwatchBookIcon />
            Yarn Palettes</a
          >
        </div>
      {/snippet}
    </Accordion.Item>
    <Accordion.Item value="information" controlHover="hover:preset-tonal">
      {#snippet control()}
        Information
      {/snippet}
      {#snippet panel()}
        <div class="mb-4 flex w-full flex-col gap-2">
          <a
            href="/faq"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/faq' && 'preset-tonal-secondary',
            ]}
          >
            <CircleHelpIcon />
            FAQ
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/contact"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/contact' && 'preset-tonal-secondary',
            ]}
          >
            <MailIcon />
            Contact
          </a>

          <a
            href="/yarn-search-request"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/yarn-search-request' &&
                'preset-tonal-secondary',
            ]}
          >
            <MessageCirclePlusIcon />
            Request Yarn
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/blog"
            class={[
              'btn hover:preset-tonal w-fit text-left',
              (page.url.pathname === '/blog' ||
                page.url.pathname.includes('/blog')) &&
                'preset-tonal-secondary',
            ]}
          >
            <RssIcon /> Blog
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/privacy"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/privacy' && 'preset-tonal-secondary',
            ]}
          >
            <ShieldAlertIcon />
            Privacy
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/documentation"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/documentation' &&
                'preset-tonal-secondary',
            ]}
          >
            <BookOpenTextIcon />
            Documentation
          </a>

          <a
            href="/changelog"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/changelog' && 'preset-tonal-secondary',
            ]}
          >
            <HistoryIcon />
            Changelog
          </a>

          <div class="border-surface-300-700 w-full border-t"></div>

          <a
            href="/api/yarn-colorways"
            class={[
              'btn hover:preset-tonal w-fit',
              page.url.pathname === '/api/yarn-colorways' &&
                'preset-tonal-secondary',
            ]}
          >
            <SquareTerminalIcon /> API
          </a>

          {#if PUBLIC_GITHUB_LINK}
            <div class="border-surface-300-700 w-full border-t"></div>
            <a
              href={PUBLIC_GITHUB_LINK}
              class="btn hover:preset-tonal w-fit"
              target="_blank"
            >
              <GithubIcon />
              GitHub
              <ExternalLinkIcon class="relative -top-[1px] size-5" />
            </a>
          {/if}
        </div>
      {/snippet}
    </Accordion.Item>
  </Accordion>

  <a
    href="/supporters"
    class={[
      'btn hover:preset-tonal w-fit',
      page.url.pathname === '/supporters' && 'preset-tonal-secondary',
    ]}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      stroke="white"
      class="mr-1 size-8 shrink-0 text-red-400 transition-all group-hover:text-red-500"
    >
      <path
        d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"
      />
    </svg>

    <span>Supporters</span>
  </a>
</div>
