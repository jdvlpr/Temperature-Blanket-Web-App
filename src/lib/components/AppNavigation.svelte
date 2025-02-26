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
  let openedNavigationItems = $state([]);
</script>

<script>
  import { page } from '$app/state';
  import { PUBLIC_GITHUB_LINK } from '$env/static/public';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { ICONS } from '$lib/constants';
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
    }

    if (page.route.id?.includes('/blog') || page.route.id?.includes('/api')) {
      openedNavigationItems = ['information'];
    }
  });
</script>

<div
  class="flex justify-start flex-col items-start text-left gap-2 my-2 w-fit px-2"
  data-sveltekit-preload-data="hover"
>
  <div><ThemeSwitcher /></div>

  <Accordion value={openedNavigationItems} collapsible multiple>
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
        <div class="flex flex-col w-full gap-2">
          <a
            href="/"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-6"
              viewBox="0 0 1024 1024"
              ><path
                fill="currentColor"
                d="M280 752h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v464c0 4.4 3.6 8 8 8m192-280h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v184c0 4.4 3.6 8 8 8m192 72h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v256c0 4.4 3.6 8 8 8m216-432H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32m-40 728H184V184h656z"
              /></svg
            >

            <span>Project Planner</span>
          </a>

          <a
            href="/yarn-colorway-finder"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname ===
              '/yarn-colorway-finder'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              viewBox="0 0 48 48"
              ><g fill="none" stroke="currentColor" stroke-width="4"
                ><path
                  stroke-linecap="round"
                  d="M4 7h40M4 23h11M4 39h11"
                /><path
                  d="M31.5 34a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z"
                /><path stroke-linecap="round" d="m37 32l7 7.05" /></g
              ></svg
            >
            <span>Yarn Colorway Finder</span>
          </a>
          <a
            href="/yarn"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/yarn'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              viewBox="0 0 24 24"
              ><g fill="none" stroke="currentColor" stroke-width="1.5"
                ><path
                  d="M2 6c0-1.4 0-2.1.272-2.635a2.5 2.5 0 0 1 1.093-1.093C3.9 2 4.6 2 6 2c1.4 0 2.1 0 2.635.272a2.5 2.5 0 0 1 1.093 1.093C10 3.9 10 4.6 10 6v12c0 1.4 0 2.1-.272 2.635a2.5 2.5 0 0 1-1.093 1.092C8.1 22 7.4 22 6 22c-1.4 0-2.1 0-2.635-.273a2.5 2.5 0 0 1-1.093-1.092C2 20.1 2 19.4 2 18z"
                /><path stroke-linecap="round" d="M7 19H5" opacity=".5" /><path
                  d="m13.314 4.929l-2.142 2.142c-.578.578-.867.867-1.02 1.235C10 8.673 10 9.082 10 9.9v9.656l8.97-8.97c.99-.99 1.486-1.485 1.671-2.056a2.5 2.5 0 0 0 0-1.545c-.185-.57-.68-1.066-1.67-2.056c-.99-.99-1.486-1.485-2.056-1.67a2.5 2.5 0 0 0-1.545 0c-.571.185-1.066.68-2.056 1.67Z"
                /><path
                  d="M6 22h12c1.4 0 2.1 0 2.635-.273a2.5 2.5 0 0 0 1.092-1.092C22 20.1 22 19.4 22 18c0-1.4 0-2.1-.273-2.635a2.5 2.5 0 0 0-1.092-1.092C20.1 14 19.4 14 18 14h-2.5"
                  opacity=".5"
                /></g
              ></svg
            >
            <span>Yarn Palette Creator</span>
          </a>
          <a
            href="/weather"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/weather'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M12.5 23q-.625 0-1.062-.425T11 21.525q0-.3.113-.575t.337-.475l1.05-.975l1.05.975q.225.2.338.475t.112.575q0 .625-.437 1.05T12.5 23m-3.45-1.5L8 20.45l2.95-2.95L12 18.55zM15.5 20L14 18.5l1.5-1.5l1.5 1.5zm-9 0L5 18.5L6.5 17L8 18.5zm1-4q-2.275 0-3.887-1.612T2 10.5q0-2.075 1.375-3.625t3.4-1.825q.8-1.425 2.188-2.238T12 2q2.25 0 3.913 1.438t2.012 3.587q1.725.15 2.9 1.425T22 11.5q0 1.875-1.312 3.188T17.5 16zm0-2h10q1.05 0 1.775-.725T20 11.5q0-1.05-.725-1.775T17.5 9H16V8q0-1.65-1.175-2.825T12 4q-1.2 0-2.187.65T8.325 6.4l-.25.6H7.45q-1.425.05-2.437 1.063T4 10.5q0 1.45 1.025 2.475T7.5 14M12 9"
              /></svg
            >

            <span>Weather Forecast</span>
          </a>
        </div>
      {/snippet}
    </Accordion.Item>
    <Accordion.Item value="gallery" controlHover="hover:preset-tonal">
      {#snippet control()}
        Gallery
      {/snippet}
      {#snippet panel()}
        <div class="flex flex-col w-full gap-2">
          <a
            href="/gallery"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/gallery'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M3 19q-.825 0-1.412-.587T1 17V7q0-.825.588-1.412T3 5h10q.825 0 1.413.588T15 7v10q0 .825-.587 1.413T13 19zm15-8q-.425 0-.712-.288T17 10V6q0-.425.288-.712T18 5h4q.425 0 .713.288T23 6v4q0 .425-.288.713T22 11zm1-2h2V7h-2zM3 17h10V7H3zm1-2h8l-2.625-3.5L7.5 14l-1.375-1.825zm14 4q-.425 0-.712-.288T17 18v-4q0-.425.288-.712T18 13h4q.425 0 .713.288T23 14v4q0 .425-.288.713T22 19zm1-2h2v-2h-2zM3 17V7zm16-8V7zm0 8v-2z"
              /></svg
            >

            <span>Projects</span>
          </a>
          <a
            href="/yarn-palette-gallery"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname ===
              '/yarn-palette-gallery'}
          >
            {@html ICONS.palette}
            <span>Yarn Palettes</span>
          </a>
        </div>
      {/snippet}
    </Accordion.Item>
    <Accordion.Item value="information" controlHover="hover:preset-tonal">
      {#snippet control()}
        Information
      {/snippet}
      {#snippet panel()}
        <div class="flex flex-col gap-2 mb-4 w-full">
          <a
            href="/faq"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/faq'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
            <span>FAQ</span>
          </a>
          <a
            href="/contact"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/contact'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
            <span>Contact</span>
          </a>

          <a
            href="/yarn-search-request"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname ===
              '/yarn-search-request'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              viewBox="0 0 48 48"
              ><path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="4"
                d="M38 4H10a2 2 0 0 0-2 2v36a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M17 30h14m-14 6h7m-5-19h10m-5 5V12"
              /></svg
            >
            <span>Request Yarn</span>
          </a>

          <div class="w-full border-t border-surface-300-700"></div>

          <a
            href="/blog"
            class="btn hover:preset-tonal w-fit gap-1 text-left"
            class:preset-tonal-secondary={page.url.pathname === '/blog' ||
              page.url.pathname.includes('/blog')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M19 5v14H5V5zm2-2H3v18h18zm-4 14H7v-1h10zm0-2H7v-1h10zm0-3H7V7h10z"
              /></svg
            >

            <span class="">Blog</span>
          </a>

          <div class="w-full border-t border-surface-300-700"></div>

          <a
            href="/privacy"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/privacy'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
              />
            </svg>

            <span>Privacy</span>
          </a>

          <div class="w-full border-t border-surface-300-700"></div>

          <a
            href="/documentation"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname ===
              '/documentation'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <span>Documentation</span>
          </a>

          <a
            href="/changelog"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname === '/changelog'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </svg>
            <span>Changelog</span>
          </a>

          <a
            href="/api/yarn-colorways"
            class="btn hover:preset-tonal w-fit gap-1"
            class:preset-tonal-secondary={page.url.pathname ===
              '/api/yarn-colorways'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>

            <span>API</span>
          </a>

          {#if PUBLIC_GITHUB_LINK}
            <a
              href={PUBLIC_GITHUB_LINK}
              class="btn hover:preset-tonal w-fit gap-1"
              target="_blank"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-6"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                /></svg
              >

              <span>GitHub</span>
            </a>
          {/if}
        </div>
      {/snippet}
    </Accordion.Item>
  </Accordion>

  <a
    href="/supporters"
    class="btn hover:preset-tonal w-fit gap-1"
    class:preset-tonal-secondary={page.url.pathname === '/supporters'}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      stroke="white"
      class="size-8 transition-all text-red-400 flex-shrink-0 group-hover:text-red-500 mr-1"
    >
      <path
        d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"
      />
    </svg>

    <span>Supporters</span>
  </a>
</div>
