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

<script>
  import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
</script>

<svelte:head>
  <title>APIs | {PUBLIC_BASE_DOMAIN_NAME}</title>
  <meta name="description" content="APIs from {PUBLIC_BASE_DOMAIN_NAME}." />

  <meta property="og:title" content="APIs | {PUBLIC_BASE_DOMAIN_NAME}" />
  <meta
    property="og:description"
    content="APIs from {PUBLIC_BASE_DOMAIN_NAME}"
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/api" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="API">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}

  {#snippet main()}
    <div
      class="m-auto my-4 flex max-w-(--breakpoint-xl) flex-wrap justify-start gap-4 px-2 lg:mt-0 lg:px-0"
    >
      <div class="flex flex-col gap-4">
        <a
          class="card hover:preset-tonal-surfacep-4 flex w-fit flex-col items-center justify-center gap-2 text-center whitespace-pre-wrap"
          href="/api/yarn-colorways"
        >
          <img
            src="/images/api-images/yarn-colorways-api.png"
            class="object-fit h-36 w-full"
            alt="Yarn Colorways API"
          />
          <span class="text-lg font-bold">Yarn Colorways API</span>
        </a>
      </div>
    </div>
  {/snippet}
</AppShell>
