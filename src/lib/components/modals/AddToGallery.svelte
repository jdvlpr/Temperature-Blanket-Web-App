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

<script lang="ts">
  import { resolve } from '$app/paths';
  import Spinner from '#lib/components/Spinner.svelte';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { sendToProjectGallery } from '#lib/utils/project-utils.svelte.js';
  import { svgToPNG } from '#lib/utils/preview-utils.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { ExternalLinkIcon } from '@lucide/svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { loadInPlace } from '#lib/utils/open-saved-project.js';
  import StickyPart from './StickyPart.svelte';
  import ShowOwnerToggle from '#lib/components/account/ShowOwnerToggle.svelte';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import type { GalleryRequest } from '#lib/utils/gallery-request.js';

  let {
    request,
    href,
  }: {
    // From My Projects: add with a choice already made, or replace the
    // project's old page with one of it as it is now
    request?: GalleryRequest;
    // From My Projects: the saved project's link, loaded behind the dialog
    href?: string;
  } = $props();

  // Getting the project ready to draw: loading it (from My Projects), then
  // its weather when that isn't kept with it
  // (the dialog is opened for one project, so its link never changes)
  let preparing = $state<'project' | 'weather' | 'error' | null>(
    untrack(() => href) ? 'project' : null,
  );
  let failed = $state<'project' | 'weather' | 'edited' | null>(null);
  const FAILED_TEXT = {
    project: "Couldn't open this project. Please try again later.",
    weather:
      "Couldn't get the weather data for this project. Please try again.",
    edited:
      "This project's edited weather data isn't saved with it. Open the project to send it to the gallery.",
  };
  let weatherAbort: AbortController | undefined;
  // Puts back the units and seasons the project's loading changed
  let restorePreferences: (() => void) | undefined;

  async function getWeather() {
    if (weather.rawData.length) return (preparing = null);
    // Edited weather can't be fetched again, and fetching would replace it
    if (weather.isUserEdited) {
      failed = 'edited';
      return (preparing = 'error');
    }
    failed = null;
    preparing = 'weather';
    const abort = (weatherAbort = new AbortController());
    try {
      const data = await weatherSearch.fetchOnly(abort);
      weather.setRawData(data);
      weather.wasLoadedFromStorage = false;
      preparing = null;
    } catch {
      if (abort.signal.aborted) return;
      failed = 'weather';
      preparing = 'error';
    }
  }

  // Whether the project loaded; its weather comes after, alongside the rest
  async function loadProject() {
    if (!href) return true;
    try {
      restorePreferences = await loadInPlace(href);
      return true;
    } catch {
      failed = 'project';
      preparing = 'error';
      return false;
    }
  }

  const onpagehide = () => restorePreferences?.();
  onDestroy(() => {
    weatherAbort?.abort();
    restorePreferences?.();
    window.removeEventListener('pagehide', onpagehide);
  });

  // In the Project menu's narrow panel: one column, not three
  const inPanel = $derived(dialog.options.placement === 'side');

  let submitting = $state(false),
    message = $state<{ text: string; icon: 'spinner' | 'none' } | undefined>();

  // Signed in with publishing from accounts on: the page is linked to the account
  let fromAccount = $state(false);
  // Include it on the account's public gallery, starting from the last choice
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());
  // The name the saved project was given, which the gallery shows as its title
  let projectName = $state('');
  // The page this one replaces, once it's known to be the account's
  let replacePostId = $state<number | undefined>();

  onMount(async () => {
    window.addEventListener('pagehide', onpagehide);
    if (!(await loadProject())) return;
    void getWeather();
    // Not saved here: the name its shared link carried, if any
    const stored = await ProjectStorage.getById(project.id);
    projectName = stored ? (stored.name ?? '') : project.linkName;
    if (!__ACCOUNTS_ENABLED__ || !account.summary) return;
    const { getGalleryPages } = await import('#lib/accounts/gallery.js');
    const gallery = await getGalleryPages();
    if (!gallery?.publishing) return;
    showOwner = gallery.settings.showOwnerDefault;
    if (request?.action === 'add') showOwner = request.showOwner;
    if (request?.action === 'replace') {
      const old = gallery.posts.find((post) => post.postId === request.postId);
      if (old) {
        replacePostId = old.postId;
        showOwner = old.showOwner ?? showOwner;
      }
    }
    if (typeof gallery.name === 'string') serverName = gallery.name;
    fromAccount = true;
  });

  async function submit() {
    const active = previews.active;
    if (!active?.svg || !active?.width || !active?.height) return;

    submitting = true;
    if (fromAccount && !href) {
      // Published from the account, it's kept there too, next to its gallery page
      const { saveOpenProject } =
        await import('#lib/storage/autosave.svelte.js');
      await saveOpenProject();
    }
    message = {
      text: "<p class='font-bold text-xl my-4 text-center'>Sending Project...</p><p class='italic'>This could take up to a few minutes. Please don't navigate away.</p>",
      icon: 'spinner',
    };
    const imgSrc = await svgToPNG({
      svgNode: active.svg,
      width: active.width,
      height: active.height,
      download: false,
    });

    const img = new Image();
    img.onload = async () => {
      message = {
        text: await sendToProjectGallery(imgSrc, {
          fromAccount,
          showOwner: fromAccount && showOwner,
          name: projectName,
          replacePostId: fromAccount ? replacePostId : undefined,
        }),
        icon: 'none',
      };
      submitting = false;
    };

    img.src = imgSrc;

    document.getElementById('temporary-canvas')?.remove();
  }
</script>

<div class="w-full p-4 pt-2 text-center">
  {#if project.gallery.href && project.gallery.title && project.gallery.title === locations.projectTitle}
    <div class="card preset-filled-surface-100-900 mt-4 p-4 text-center">
      <p class="my-2">
        This project has a gallery page:
        <a
          href={project.gallery.href}
          target="_blank"
          class="link btn hover:preset-tonal-surface w-fit whitespace-pre-wrap"
          rel="noreferrer"
          ><ExternalLinkIcon class="icon-sm" />{project.gallery.title}</a
        >
      </p>
    </div>
  {/if}
  <div
    class="grid max-w-(--breakpoint-sm) grid-cols-1 gap-4 {inPanel
      ? ''
      : 'sm:grid-cols-3'}"
  >
    {#if preparing}
      <div
        class="col-span-full flex w-full flex-col items-center justify-center gap-4 py-8"
        role="status"
        aria-live="polite"
      >
        {#if preparing === 'error'}
          <p>{failed ? FAILED_TEXT[failed] : ''}</p>
        {:else}
          <Spinner />
          <p>
            {#if preparing === 'weather' && weatherSearch.label}
              Getting weather data for {weatherSearch.label}…
            {:else}
              Getting the project ready…
            {/if}
          </p>
        {/if}
      </div>
    {:else if !message}
      <div
        class="col-span-full flex flex-col gap-2 {inPanel
          ? ''
          : 'sm:col-span-2'}"
      >
        {#if replacePostId}
          <p class="bg-surface-100-900 rounded-container p-4 text-left">
            This adds a new gallery page of the project as it is now, and
            removes its old one. The new page has a new link, and its views
            start over.
          </p>
        {/if}
        <p class="text-left text-lg font-bold">
          Do you understand and agree to the following terms and conditions?
        </p>
        <div class="flex flex-col gap-2 text-left">
          <p>
            • I am submitting this project's {projectName
              ? 'name, '
              : ''}location and dates, gauge and yarn information, URL, preview
            image, and the current date to be displayed as a gallery page in the
            public
            <a href="/gallery" target="_blank" class="link">Project Gallery</a>
          </p>
          {#if fromAccount}
            <p>
              • It will be linked to your account, so you can change who sees it
              or remove it later from
              <a href={resolve('my-projects')} target="_blank" class="link"
                >My Projects</a
              >.
            </p>
          {/if}
          <p>
            • This project's gallery page cannot be edited once it is submitted.
          </p>
          <p>
            • Submissions which appear to be spam or abuse of this service may
            be removed.
          </p>
          <p>• Gallery pages are subject to change.</p>
        </div>
        {#if fromAccount}
          <ShowOwnerToggle
            kind="project"
            bind:checked={showOwner}
            name={ownerName}
          />
        {/if}
      </div>
      <div
        class="bg-surface-50 dark:bg-surface-950 rounded-container pointer-events-none col-span-full m-auto mb-4 flex w-full max-w-[250px] flex-col gap-2 p-4 {inPanel
          ? ''
          : 'sm:col-span-1'}"
      >
        <span class="line-clamp-4 font-bold"
          >{projectName || locations.projectTitle}</span
        >
        {#if previews.active}
          <previews.active.previewComponent />
        {/if}
      </div>
    {:else}
      <div
        class="col-span-full flex w-full flex-col items-center justify-center gap-4"
      >
        {#if message.icon === 'spinner'}
          <Spinner />
        {/if}

        <div class="my-2 flex flex-col items-center justify-center gap-2">
          {@html message.text}
        </div>
      </div>
    {/if}
  </div>
</div>

<StickyPart position="bottom">
  {#if preparing}
    <div class="flex flex-wrap items-center justify-center gap-2 p-2 py-4">
      {#if failed === 'edited' && href}
        <a class="btn preset-filled-primary-500" {href} data-sveltekit-reload
          >Open Project</a
        >
      {:else if failed === 'weather'}
        <button
          class="btn preset-filled-primary-500"
          onclick={() => void getWeather()}>Try Again</button
        >
      {/if}
      <button class="btn preset-tonal" onclick={() => dialog.close()}
        >{preparing === 'error' ? 'Close' : 'Cancel'}</button
      >
    </div>
  {:else if !submitting && !message}
    <div
      class="flex flex-col items-center justify-center gap-2 p-2 py-4 text-center"
    >
      <p class="text-sm italic">
        {#if fromAccount}
          You can remove it later from My Projects.
        {:else}
          This action can't be undone.
        {/if}
      </p>
      <button
        class="btn preset-filled-primary-500"
        title="Add project to gallery"
        disabled={!previews.active?.svg}
        onclick={submit}
        >{replacePostId
          ? 'Yes, Update Gallery Page'
          : 'Yes, Send to Gallery'}</button
      >
    </div>
  {/if}
</StickyPart>
