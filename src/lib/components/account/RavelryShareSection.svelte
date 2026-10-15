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

<!-- @component
  The Ravelry part of a saved project's Share dialog: Connect Ravelry (in
  Account), Post to Ravelry, or once posted View on Ravelry, Update on
  Ravelry and Photos. Posting needs the project in the account.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import { PANEL_LIST, PANEL_ROW } from '#lib/constants/class-constants.js';
  import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
  import {
    inAccount,
    openRavelryPhotos,
    openRavelryPost,
  } from '#lib/utils/open-ravelry.js';
  import {
    ExternalLinkIcon,
    ImagesIcon,
    LinkIcon,
    LoaderCircleIcon,
    RefreshCwIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let { item }: { item: StoredProjectIndexItem } = $props();

  onMount(() => {
    if (!ravelryLinks.status) void ravelryLinks.load();
  });

  const link = $derived(ravelryLinks.links.get(item.id) ?? null);
  const status = $derived(ravelryLinks.status);
  const photoCount = $derived(link?.photos.length ?? 0);
</script>

<!-- Only where the site has Ravelry on -->
{#if !status || status.available}
  <section class="flex flex-col gap-2" aria-labelledby="share-ravelry">
    <div class="flex flex-col">
      <h3 id="share-ravelry" class="font-bold">Ravelry</h3>
      <p class="text-sm opacity-80">
        {#if !status}
          <LoaderCircleIcon
            class="icon-sm inline animate-spin"
            aria-hidden="true"
          />
          Checking…
        {:else if !ravelryLinks.connected}
          {status.connected ? 'Reconnect Ravelry to use it' : 'Not connected'}
        {:else if link}
          On Ravelry{photoCount
            ? ` · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}`
            : ''}
        {:else}
          Not posted
        {/if}
      </p>
    </div>

    {#if status && !ravelryLinks.connected}
      <ul class={PANEL_LIST}>
        <li>
          <a class={PANEL_ROW} href={resolve('/account')}>
            <LinkIcon class="shrink-0 opacity-70" aria-hidden="true" />
            <span class="flex flex-1 flex-col">
              <span>{status.connected ? 'Reconnect' : 'Connect'} Ravelry</span>
              <span class="text-xs opacity-70"
                >In Account, under Connected accounts. Then post your projects
                and their photos there.</span
              >
            </span>
          </a>
        </li>
      </ul>
    {:else if status && !link}
      {#if inAccount(item)}
        <ul class={PANEL_LIST}>
          <li>
            <button
              type="button"
              class={PANEL_ROW}
              onclick={() => void openRavelryPost(item)}
            >
              <SendIcon class="shrink-0 opacity-70" aria-hidden="true" />
              <span class="flex flex-1 flex-col">
                <span>Post to Ravelry…</span>
                <span class="text-xs opacity-70"
                  >A Ravelry project with its picture, yarns and a link back
                  here</span
                >
              </span>
            </button>
          </li>
        </ul>
      {:else}
        <p class="text-sm">
          Add this project to your account first (Add to your account, at the
          top of My Projects), then post it to Ravelry.
        </p>
      {/if}
    {:else if link}
      <ul class={PANEL_LIST}>
        <li>
          <!-- eslint-disable svelte/no-navigation-without-resolve -- Ravelry's site -->
          <a
            class={PANEL_ROW}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLinkIcon class="shrink-0 opacity-70" aria-hidden="true" />
            <span class="flex-1"
              >View on Ravelry<span class="sr-only">
                (opens in a new tab)</span
              ></span
            >
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        </li>
        <li>
          <button
            type="button"
            class={PANEL_ROW}
            onclick={() => void openRavelryPost(item)}
          >
            <RefreshCwIcon class="shrink-0 opacity-70" aria-hidden="true" />
            <span class="flex flex-1 flex-col">
              <span>Update on Ravelry…</span>
              <span class="text-xs opacity-70"
                >Its picture and link always; name, dates, status and notes if
                you choose</span
              >
            </span>
          </button>
        </li>
        <li>
          <button
            type="button"
            class={PANEL_ROW}
            onclick={() => void openRavelryPhotos(item)}
          >
            <ImagesIcon class="shrink-0 opacity-70" aria-hidden="true" />
            <span class="flex flex-1 flex-col">
              <span>Photos…</span>
              <span class="text-xs opacity-70"
                >Add photos of your blanket, stored on Ravelry</span
              >
            </span>
          </button>
        </li>
      </ul>
    {/if}
  </section>
{/if}
