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
  Post to Ravelry / Update on Ravelry, from My Projects. The project loads
  behind it (as Publish to Gallery does), so its picture is drawn full size.
  Posting creates a Ravelry project: name, craft, status, dates, notes with a
  line linking back here, one yarn per color (linked to Ravelry's yarn when
  confirmed), and the picture. Updating always replaces the picture and the
  link line; the name, dates, status and notes change only when ticked, so
  edits made on Ravelry stay.
-->
<script lang="ts">
  import {
    addRavelryPhoto,
    getRavelryOptions,
    postRavelryProject,
    ravelryErrorMessage,
    searchRavelryYarns,
    type RavelryOption,
    type RavelryYarnMatch,
  } from '#lib/accounts/ravelry.js';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import { extraColorsFromProjectHref } from '#lib/utils/extra-colors-utils.js';
  import { loadInPlace } from '#lib/utils/open-saved-project.js';
  import { svgToPNG } from '#lib/utils/preview-utils.svelte.js';
  import {
    CheckIcon,
    ExternalLinkIcon,
    LoaderCircleIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, untrack } from 'svelte';

  let {
    projectId,
    href,
    name: initialName,
  }: {
    projectId: string;
    /** The saved project's link, loaded behind the dialog */
    href: string;
    /** Its name in My Projects */
    name: string;
  } = $props();

  // Posted already: this updates that Ravelry project
  const updating = untrack(() => Boolean(ravelryLinks.links.get(projectId)));

  // ---- Getting the project ready to draw (as Publish to Gallery does)
  let preparing = $state<'project' | 'weather' | 'error' | null>('project');
  let prepareError = $state('');
  let restorePreferences: (() => void) | undefined;
  let weatherAbort: AbortController | undefined;
  let destroyed = false;

  async function prepare() {
    try {
      restorePreferences = await loadInPlace(href, () => destroyed);
      if (destroyed) return restorePreferences?.();
    } catch {
      prepareError = 'Couldn’t open this project. Try again later.';
      return (preparing = 'error');
    }
    if (weather.rawData.length) return (preparing = null);
    if (weather.isUserEdited) {
      prepareError =
        'This project’s edited weather data isn’t saved with it. Open the project to post it.';
      return (preparing = 'error');
    }
    preparing = 'weather';
    const abort = (weatherAbort = new AbortController());
    try {
      weather.setRawData(await weatherSearch.fetchOnly(abort));
      weather.wasLoadedFromStorage = false;
      preparing = null;
    } catch {
      if (abort.signal.aborted) return;
      prepareError =
        'Couldn’t get the weather data for this project. Try again.';
      preparing = 'error';
    }
  }

  const onpagehide = () => restorePreferences?.();
  onDestroy(() => {
    destroyed = true;
    weatherAbort?.abort();
    restorePreferences?.();
    window.removeEventListener('pagehide', onpagehide);
  });

  // ---- The form
  let name = $state(untrack(() => initialName));
  let crafts = $state<RavelryOption[]>([]);
  let statuses = $state<RavelryOption[]>([]);
  let craftId = $state<number | null>(null);
  let statusId = $state<number | null>(null);
  let notes = $state('');
  let update = $state({
    name: false,
    dates: false,
    status: false,
    notes: false,
  });

  const CRAFT_KEY = 'tb-ravelry-craft';
  const rememberedCraft = () => {
    try {
      return Number(localStorage.getItem(CRAFT_KEY)) || null;
    } catch {
      return null;
    }
  };
  const rememberCraft = (id: number | null) => {
    try {
      if (id) localStorage.setItem(CRAFT_KEY, String(id));
    } catch {
      // Not remembered this time
    }
  };

  // The project's dates, once it's loaded: its first location's start to its last's end
  const toDay = (value?: string) => value?.slice(0, 10) || null;
  const started = $derived(
    toDay(
      locations.all
        .map((l) => l.from)
        .filter(Boolean)
        .sort()[0],
    ),
  );
  const finishBy = $derived(
    toDay(
      locations.all
        .map((l) => l.to)
        .filter(Boolean)
        .sort()
        .at(-1),
    ),
  );

  // ---- Yarns: one per color; each yarn (brand + yarn) can be linked to Ravelry's
  const colors: Color[] = untrack(() => [
    ...(getColorsFromInput({ string: href }) || []),
    ...extraColorsFromProjectHref(href).map((extra) => extra.color),
  ]);
  const yarnName = (color: Color) =>
    [color.brandName, color.yarnName].filter(Boolean).join(' ');
  // Each color once
  const packs = colors.filter(
    (color, i) =>
      colors.findIndex(
        (other) => other.hex === color.hex && other.name === color.name,
      ) === i,
  );
  const distinctYarns = [...new Set(packs.map(yarnName).filter(Boolean))];

  type YarnChoice = {
    name: string;
    matches: RavelryYarnMatch[];
    /** The Ravelry yarn chosen, or 0 for none (sent as text) */
    chosen: number;
    searching: boolean;
  };
  let yarnChoices = $state<YarnChoice[]>(
    distinctYarns.map((name) => ({
      name,
      matches: [],
      chosen: 0,
      searching: true,
    })),
  );

  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  // Suggested only when Ravelry's yarn has this name, from the same brand
  function suggestion(name: string, matches: RavelryYarnMatch[]) {
    const wanted = normalize(name);
    return (
      matches.find((m) => {
        const full = normalize(`${m.company} ${m.name}`);
        return (
          full === wanted ||
          (wanted.includes(normalize(m.company)) &&
            wanted.endsWith(normalize(m.name)))
        );
      })?.id ?? 0
    );
  }

  async function findMatches() {
    // One at a time: requests are shared on the free plan
    for (const choice of yarnChoices) {
      if (destroyed) return;
      try {
        choice.matches = await searchRavelryYarns(choice.name);
        choice.chosen = suggestion(choice.name, choice.matches);
      } catch {
        choice.matches = [];
      } finally {
        choice.searching = false;
      }
    }
  }

  let optionsError = $state('');
  onMount(async () => {
    window.addEventListener('pagehide', onpagehide);
    void prepare();
    try {
      const options = await getRavelryOptions();
      crafts = options.crafts;
      statuses = options.statuses;
      craftId =
        rememberedCraft() ??
        crafts.find((c) => /crochet/i.test(c.name))?.id ??
        crafts[0]?.id ??
        null;
      statusId =
        statuses.find((s) => /progress/i.test(s.name))?.id ??
        statuses[0]?.id ??
        null;
    } catch (e) {
      optionsError = ravelryErrorMessage(e);
    }
    void findMatches();
  });

  // ---- Sending
  let step = $state<'picture' | 'project' | 'photo' | null>(null);
  let sendError = $state('');
  let done = $state<{ url: string; photoPending: boolean } | null>(null);
  const STEP_TEXT = {
    picture: 'Drawing the picture…',
    project: updating ? 'Updating on Ravelry…' : 'Posting to Ravelry…',
    photo: 'Adding the picture on Ravelry…',
  };

  const canSend = $derived(
    !preparing &&
      !step &&
      !!previews.active?.svg &&
      name.trim().length > 0 &&
      !optionsError,
  );

  // The link back: this project on this site, as it's saved
  function projectLink() {
    const url = new URL(href, location.origin);
    return `${location.origin}${url.pathname}${url.search}${url.hash}`;
  }

  async function send(event: Event) {
    event.preventDefault();
    const active = previews.active;
    if (!canSend || !active?.svg || !active.width || !active.height) return;
    sendError = '';
    rememberCraft(craftId);
    try {
      step = 'picture';
      const png = await svgToPNG({
        svgNode: active.svg,
        width: active.width,
        height: active.height,
        download: false,
      });
      document.getElementById('temporary-canvas')?.remove();
      const picture = await (await fetch(png)).blob();

      step = 'project';
      const byName = new Map(yarnChoices.map((c) => [c.name, c.chosen]));
      const link = await postRavelryProject(projectId, {
        name: name.trim(),
        craftId,
        statusId,
        started,
        finishBy,
        link: projectLink(),
        notes: notes.trim(),
        yarns: packs.map((color) => ({
          name: yarnName(color),
          colorway: color.name ?? '',
          ...(byName.get(yarnName(color))
            ? { ravelryYarnId: byName.get(yarnName(color)) }
            : {}),
        })),
        ...(updating ? { update } : {}),
      });
      ravelryLinks.set(link);

      step = 'photo';
      let photoPending = false;
      try {
        const result = await addRavelryPhoto(projectId, picture, {
          picture: true,
        });
        ravelryLinks.set({ ...link, photos: result.photos });
        photoPending = result.processing;
      } catch {
        // The project is there; the picture can be added again with Update
        photoPending = true;
      }
      done = { url: link.url, photoPending };
    } catch (e) {
      sendError = ravelryErrorMessage(e);
    } finally {
      step = null;
    }
  }

  const preparingText = $derived(
    preparing === 'error'
      ? prepareError
      : preparing === 'weather' && weatherSearch.label
        ? `Getting weather data for ${weatherSearch.label}…`
        : preparing
          ? 'Getting the project ready…'
          : '',
  );
</script>

{#if done}
  <div class="flex flex-col gap-4 p-4 text-left" role="status">
    <p class="flex items-center gap-2 font-bold">
      <CheckIcon aria-hidden="true" />
      {updating ? 'Updated on Ravelry' : 'Posted to Ravelry'}
    </p>
    {#if done.photoPending}
      <p class="text-sm">
        Ravelry is still adding the picture. It shows up there in a moment.
      </p>
    {/if}
    <div class="flex flex-wrap gap-2">
      <!-- eslint-disable svelte/no-navigation-without-resolve -- Ravelry's site -->
      <a
        class="btn preset-filled-primary-500"
        href={done.url}
        target="_blank"
        rel="noopener noreferrer"
        ><ExternalLinkIcon aria-hidden="true" />View on Ravelry<span
          class="sr-only"
        >
          (opens in a new tab)</span
        ></a
      >
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
      <button
        type="button"
        class="btn preset-tonal-surface"
        onclick={() => dialog.close()}>Done</button
      >
    </div>
  </div>
{:else}
  <form
    class="flex flex-col gap-4 p-4 text-left"
    onsubmit={send}
    inert={!!step}
  >
    <div
      class="bg-surface-50 dark:bg-surface-950 rounded-container flex items-center gap-4 p-4"
    >
      <div class="pointer-events-none w-24 shrink-0 sm:w-32" aria-hidden="true">
        {#if previews.active && !preparing}
          <previews.active.previewComponent />
        {:else if preparing !== 'error'}
          <LoaderCircleIcon class="animate-spin" />
        {/if}
      </div>
      <p class="text-sm" role="status">
        {preparingText ||
          (updating
            ? 'This picture goes to Ravelry, in place of the last one.'
            : 'This picture goes to Ravelry.')}
      </p>
    </div>

    <label class="label">
      <span class="label-text">Project name on Ravelry</span>
      <input class="input" bind:value={name} maxlength="100" required />
    </label>

    {#if optionsError}
      <p class="text-error-700-300 text-sm" role="alert">{optionsError}</p>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="label">
          <span class="label-text">Craft</span>
          <select class="select" bind:value={craftId}>
            {#each crafts as craft (craft.id)}
              <option value={craft.id}>{craft.name}</option>
            {/each}
          </select>
        </label>
        <label class="label">
          <span class="label-text">Status</span>
          <select class="select" bind:value={statusId}>
            {#each statuses as status (status.id)}
              <option value={status.id}>{status.name}</option>
            {/each}
          </select>
        </label>
      </div>
    {/if}

    {#if started || finishBy}
      <p class="text-sm">
        Dates: {started ?? '?'} to {finishBy ?? '?'} (started and finish-by on Ravelry)
      </p>
    {/if}

    {#if !updating}
      <label class="label">
        <span class="label-text">Notes (optional)</span>
        <textarea class="textarea" rows="3" bind:value={notes} maxlength="5000"
        ></textarea>
      </label>
    {/if}
    <p class="text-sm opacity-80">
      The project’s public notes on Ravelry end with “Planned with Temperature
      Blanket” and a link to this project.
    </p>

    {#if updating}
      <fieldset class="flex flex-col gap-2">
        <legend class="label-text mb-1"
          >Also change on Ravelry (otherwise what’s there stays)</legend
        >
        <label class="flex items-center gap-2">
          <input class="checkbox" type="checkbox" bind:checked={update.name} />
          Name
        </label>
        <label class="flex items-center gap-2">
          <input class="checkbox" type="checkbox" bind:checked={update.dates} />
          Dates
        </label>
        <label class="flex items-center gap-2">
          <input
            class="checkbox"
            type="checkbox"
            bind:checked={update.status}
          />
          Status
        </label>
        <label class="flex items-center gap-2">
          <input class="checkbox" type="checkbox" bind:checked={update.notes} />
          Replace the notes
        </label>
        {#if update.notes}
          <label class="label">
            <span class="label-text">New notes</span>
            <textarea
              class="textarea"
              rows="3"
              bind:value={notes}
              maxlength="5000"></textarea>
          </label>
        {/if}
      </fieldset>
    {:else if yarnChoices.length}
      <fieldset class="flex flex-col gap-3">
        <legend class="label-text mb-1">Yarns on Ravelry</legend>
        <p class="text-sm opacity-80">
          Each color is added as a yarn. Link it to Ravelry’s page for the yarn,
          or keep just its name.
        </p>
        {#each yarnChoices as choice (choice.name)}
          <label class="label">
            <span class="label-text">{choice.name}</span>
            {#if choice.searching}
              <span class="flex items-center gap-2 text-sm"
                ><LoaderCircleIcon
                  class="icon-sm animate-spin"
                  aria-hidden="true"
                />
                Looking for it on Ravelry…</span
              >
            {:else}
              <select class="select" bind:value={choice.chosen}>
                <option value={0}>Don’t link (name only)</option>
                {#each choice.matches as match (match.id)}
                  <option value={match.id}
                    >{match.company}
                    {match.name}{match.weight
                      ? ` · ${match.weight}`
                      : ''}{match.discontinued ? ' · discontinued' : ''}</option
                  >
                {/each}
              </select>
            {/if}
          </label>
        {/each}
      </fieldset>
    {/if}

    {#if sendError}
      <p class="text-error-700-300 text-sm" role="alert">{sendError}</p>
    {/if}
    {#if step}
      <p class="flex items-center gap-2 text-sm" role="status">
        <LoaderCircleIcon class="icon-sm animate-spin" aria-hidden="true" />
        {STEP_TEXT[step]}
      </p>
    {/if}

    <div class="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        class="btn preset-tonal-surface"
        onclick={() => dialog.close()}>Cancel</button
      >
      <button
        type="submit"
        class="btn preset-filled-primary-500"
        disabled={!canSend}
        ><SendIcon aria-hidden="true" />{updating
          ? 'Update on Ravelry'
          : 'Post to Ravelry'}</button
      >
    </div>
  </form>
{/if}
