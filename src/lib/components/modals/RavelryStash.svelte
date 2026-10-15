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
  From My Ravelry Stash: a palette from the yarn in your Ravelry stash. Stash
  yarns matched to the app's yarn data come with their colors, as colorway
  cards to choose; the rest are listed with their Ravelry photo, to pick each
  one's color from it (the color keeps the stash's names). Not connected (or
  the connection stopped working): says so, with Connect.
-->
<script lang="ts">
  import {
    connectRavelry,
    getRavelryStash,
    ravelryErrorMessage,
    RavelryRequestError,
    type RavelryStashEntry,
  } from '#lib/accounts/ravelry.js';
  import PaletteStripEditor from '#lib/components/PaletteStripEditor.svelte';
  import PickColorFromImage from '#lib/components/modals/PickColorFromImage.svelte';
  import SaveAndCloseButtons from '#lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '#lib/components/modals/StickyPart.svelte';
  import ColorwayCards from '#lib/components/yarn-colorways/ColorwayCards.svelte';
  import { colorwayKey } from '#lib/components/yarn-colorways/colorway-utils.js';
  import {
    ensureYarnData,
    getColorwaysWithAffiliateLinks,
  } from '#lib/data/yarns/colorways.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { stashMatcher } from '#lib/utils/ravelry-stash-match.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import { LoaderCircleIcon, PipetteIcon } from '@lucide/svelte';
  import { onMount, tick } from 'svelte';

  let { updateGauge }: { updateGauge: (args: { _colors: Color[] }) => void } =
    $props();

  let loading = $state(true);
  let problem = $state<'connect' | 'error' | null>(null);
  let errorMessage = $state('');

  /** Stash yarns with a color: matched, or picked from their photo here */
  let colored = $state<Color[]>([]);
  /** Stash yarns without one yet */
  let unmatched = $state<RavelryStashEntry[]>([]);
  let selected = $state<Color[]>([]);
  /** Picking a color from this one's photo, in this dialog's place */
  let picking = $state<RavelryStashEntry | null>(null);
  let container: HTMLElement | null = $state(null);

  onMount(async () => {
    try {
      const [stash] = await Promise.all([getRavelryStash(), ensureYarnData()]);
      const match = stashMatcher(getColorwaysWithAffiliateLinks());
      for (const entry of stash) {
        const found = match(entry);
        if (found) {
          // Two stash entries of one colorway show once
          const key = colorwayKey(found.color);
          if (!colored.some((c) => colorwayKey(c) === key))
            colored.push(found.color);
        } else unmatched.push(entry);
      }
    } catch (e) {
      if (
        e instanceof RavelryRequestError &&
        (e.code === 'RAVELRY_RECONNECT' ||
          e.code === 'RAVELRY_OFF' ||
          e.status === 404)
      )
        problem = 'connect';
      else {
        problem = 'error';
        errorMessage = ravelryErrorMessage(e);
      }
    } finally {
      loading = false;
    }
  });

  const isSelected = (color: Color) =>
    selected.some((c) => colorwayKey(c) === colorwayKey(color));
  function toggle(color: Color) {
    selected = isSelected(color)
      ? selected.filter((c) => colorwayKey(c) !== colorwayKey(color))
      : [...selected, color];
  }

  const photoUrl = (entry: RavelryStashEntry) =>
    entry.photo?.medium ?? entry.photo?.small ?? null;
  const proxied = (url: string) =>
    `/api/account/ravelry/photo?url=${encodeURIComponent(url)}`;
  const entryLabel = (entry: RavelryStashEntry) =>
    [entry.brand, entry.yarn, entry.colorway].filter(Boolean).join(' · ');

  async function picked(entry: RavelryStashEntry, hex: string) {
    const color: Color = {
      hex,
      name: entry.colorway || entry.yarn,
      brandName: entry.brand,
      yarnName: entry.yarn,
    };
    colored = [...colored, color];
    unmatched = unmatched.filter((e) => e.id !== entry.id);
    selected = [...selected, color];
    picking = null;
    await tick();
    container?.focus({ preventScroll: true });
  }
</script>

{#if picking}
  {@const url = photoUrl(picking)}
  {@const entry = picking}
  {#if url}
    <PickColorFromImage
      src={proxied(url)}
      onPick={(hex: string) => picked(entry, hex)}
      onBack={() => (picking = null)}
    />
  {/if}
{/if}

<div
  bind:this={container}
  tabindex="-1"
  class="flex flex-1 flex-col gap-4 p-2 outline-none"
  hidden={!!picking}
>
  {#if loading}
    <p class="flex items-center gap-2" role="status">
      <LoaderCircleIcon class="animate-spin" aria-hidden="true" />
      Getting your stash from Ravelry…
    </p>
  {:else if problem === 'connect'}
    <p>Connect your Ravelry account to plan with the yarn in your stash.</p>
    <button
      type="button"
      class="btn preset-filled-primary-500 self-start"
      onclick={() => connectRavelry()}>Connect Ravelry</button
    >
  {:else if problem === 'error'}
    <p class="text-error-700-300" role="alert">{errorMessage}</p>
  {:else if !colored.length && !unmatched.length}
    <p>Your Ravelry stash is empty.</p>
  {:else}
    {#if colored.length}
      <section class="flex flex-col gap-2" aria-labelledby="stash-colored">
        <h3 id="stash-colored" class="text-sm font-bold">
          {colored.length}
          {pluralize('colorway', colored.length)} from your stash
        </h3>
        <ColorwayCards
          colorways={colored}
          selection={{ isSelected, ontoggle: toggle }}
        />
      </section>
    {/if}
    {#if unmatched.length}
      <section class="flex flex-col gap-2" aria-labelledby="stash-unmatched">
        <h3 id="stash-unmatched" class="text-sm font-bold">
          Without a color yet
        </h3>
        <p class="text-sm opacity-80">
          These aren’t in Temperature Blanket’s yarn list. Pick each one’s color
          from its photo on Ravelry.
        </p>
        <ul class="flex flex-col gap-2">
          {#each unmatched as entry (entry.id)}
            {@const url = photoUrl(entry)}
            <li
              class="bg-surface-100 dark:bg-surface-900 rounded-container flex items-center gap-3 p-2"
            >
              {#if entry.photo?.small}
                <img
                  src={entry.photo.small}
                  alt=""
                  class="rounded-base size-12 shrink-0 object-cover"
                  loading="lazy"
                />
              {/if}
              <span class="min-w-0 flex-1 text-sm">{entryLabel(entry)}</span>
              {#if url}
                <button
                  type="button"
                  class="btn btn-sm preset-tonal-surface shrink-0"
                  aria-label={`Pick a color from the photo of ${entryLabel(entry)}`}
                  onclick={() => (picking = entry)}
                  ><PipetteIcon class="icon-sm" aria-hidden="true" />Pick a
                  Color</button
                >
              {:else}
                <span class="shrink-0 text-xs opacity-70">No photo</span>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

{#if !picking}
  <StickyPart position="bottom">
    <div class="p-2">
      {#if selected.length}
        <PaletteStripEditor bind:colors={selected}>
          {#snippet toolbar()}
            <p class="text-xs">
              {selected.length}
              {pluralize('Colorway', selected.length)}
            </p>
          {/snippet}
        </PaletteStripEditor>
      {/if}
      <div class="max-sm:pb-2">
        <SaveAndCloseButtons
          onSave={() => {
            updateGauge({ _colors: selected });
            dialog.close();
          }}
          onClose={() => dialog.close()}
          disabled={!selected.length}
        />
      </div>
    </div>
  </StickyPart>
{/if}
