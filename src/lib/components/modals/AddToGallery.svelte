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

<!-- Publishes the open project to the Project Gallery, or updates its gallery
page in place (same link, views and settings) when it has one: each project has
one page. It shows the project as its gallery card will (preview, name, and "By"
with the account's name), then publishes it and links to the page. Publishing
needs an account; signed out, it says so with a way to sign in. From My
Library, the saved project loads behind the dialog first (with its weather,
when that isn't kept with it). -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import RenameProject from '#lib/components/RenameProject.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import AnonymousCheckbox from '#lib/components/account/AnonymousCheckbox.svelte';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import type { GalleryRequest } from '#lib/utils/gallery-request.js';
  import { loadInPlace } from '#lib/utils/open-saved-project.js';
  import { svgToPNG } from '#lib/utils/preview-utils.svelte.js';
  import {
    sendToProjectGallery,
    type GallerySendResult,
    type GallerySendStep,
  } from '#lib/utils/project-utils.svelte.js';
  import {
    CheckIcon,
    ExternalLinkIcon,
    LoaderCircleIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import StickyPart from './StickyPart.svelte';

  let {
    request,
    href,
  }: {
    // From My Library: add with a choice already made, or update that page
    // to the project as it is now
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
      "This project's edited weather data isn't saved with it. Open the project to publish it.",
  };
  const preparingText = $derived(
    preparing === 'error'
      ? failed
        ? FAILED_TEXT[failed]
        : ''
      : preparing === 'weather' && weatherSearch.label
        ? `Getting weather data for ${weatherSearch.label}…`
        : preparing
          ? 'Getting the project ready…'
          : '',
  );
  let weatherAbort: AbortController | undefined;
  // Puts back the units and seasons the project's loading changed
  let restorePreferences: (() => void) | undefined;
  // Closed, maybe while the project was still loading
  let destroyed = false;

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
      restorePreferences = await loadInPlace(href, () => destroyed);
      if (destroyed) restorePreferences?.();
      return !destroyed;
    } catch {
      failed = 'project';
      preparing = 'error';
      return false;
    }
  }

  const onpagehide = () => restorePreferences?.();
  onDestroy(() => {
    destroyed = true;
    weatherAbort?.abort();
    restorePreferences?.();
    window.removeEventListener('pagehide', onpagehide);
  });

  // Why it can't be published from here, once the account is checked
  let blocked = $state<'signed-out' | 'paused' | null>(null);
  let accountChecked = $state(false);
  // Include a new page on the account's public gallery, starting from the last
  // choice (an update keeps the page's own)
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());
  // The project's gallery page, updated in place, if it has one
  let page = $state<{ postId: number; showOwner?: boolean } | null>(null);

  // Sent: its page
  let sent = $state<Extract<GallerySendResult, { status: 'sent' }> | null>(
    null,
  );

  const view = $derived(
    preparing
      ? 'preparing'
      : sent
        ? 'sent'
        : !accountChecked
          ? 'checking'
          : blocked
            ? 'blocked'
            : 'form',
  );

  onMount(async () => {
    window.addEventListener('pagehide', onpagehide);
    if (!(await loadProject())) return;
    void getWeather();
    try {
      await checkAccount();
    } catch {
      blocked = 'paused';
    } finally {
      accountChecked = true;
    }
  });

  // Whether it can be sent, and its page in the account if it has one
  async function checkAccount() {
    if (!__ACCOUNTS_ENABLED__ || !account.summary) {
      blocked = 'signed-out';
      return;
    }
    const { getGalleryPages } = await import('#lib/accounts/gallery.js');
    const gallery = await getGalleryPages();
    if (!gallery) {
      blocked = 'signed-out';
      return;
    }
    if (!gallery.publishing) {
      blocked = 'paused';
      return;
    }
    showOwner = gallery.settings.showOwnerDefault;
    if (request?.action === 'add' && request.showOwner !== undefined)
      showOwner = request.showOwner;
    // Its newest page (older versions came from before pages were updated)
    const own = gallery.posts
      .filter(
        (post) =>
          post.kind !== 'palette' &&
          (request?.action === 'replace'
            ? post.postId === request.postId
            : post.projectId === project.id),
      )
      .sort((a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId)[0];
    if (own) page = { postId: own.postId, showOwner: own.showOwner };
    if (typeof gallery.name === 'string') serverName = gallery.name;
  }

  // Every footer: secondary actions, then the one filled primary
  const FOOTER =
    'bg-surface-50 dark:bg-surface-950 flex flex-wrap items-center justify-center gap-2 px-2 py-3 sm:px-4';

  let busy = $state(false);
  let step = $state<'image' | GallerySendStep | null>(null);
  const STEP_TEXT = {
    image: 'Drawing the preview image…',
    sending: 'Publishing… This can take a minute.',
  };
  let problem = $state<Exclude<GallerySendResult, { status: 'sent' }> | null>(
    null,
  );
  // The page's own link, for after it's sent
  let sentHeading = $state<HTMLElement>();
  const stepText = $derived(step ? STEP_TEXT[step] : '');

  async function submit() {
    const active = previews.active;
    if (!active?.svg || !active?.width || !active?.height || busy) return;
    busy = true;
    problem = null;
    try {
      if (!href) {
        // Published from the account, it's kept there too, next to its gallery page
        const { saveOpenProject } =
          await import('#lib/storage/autosave.svelte.js');
        await saveOpenProject();
      }
      // The name it has now, which may have just been changed here
      const stored = await ProjectStorage.getById(project.id);
      const name = stored ? (stored.name ?? '') : project.linkName;
      step = 'image';
      const img = await svgToPNG({
        svgNode: active.svg,
        width: active.width,
        height: active.height,
        download: false,
      });
      document.getElementById('temporary-canvas')?.remove();
      const result = await sendToProjectGallery(img, {
        showOwner,
        name,
        postId: page?.postId,
        onStep: (next) => (step = next),
      });
      if (result.status === 'sent') {
        sent = result;
        await tick();
        sentHeading?.focus();
      } else {
        problem = result;
        // Unpublished elsewhere: sending again publishes a new page
        if (result.status === 'gone') page = null;
      }
    } catch {
      problem = { status: 'error', message: '' };
    } finally {
      busy = false;
      step = null;
    }
  }

  const problemText = $derived.by(() => {
    if (!problem) return '';
    if (problem.status === 'too-large')
      return 'This project is too large for the gallery. Try a shorter date range or fewer locations.';
    if (problem.status === 'paused')
      return 'Publishing to the gallery is paused right now. Try again later.';
    if (problem.status === 'signed-out')
      return 'You’re signed out. Sign in again, then try again.';
    if (problem.status === 'unsupported')
      return 'The gallery can’t update pages yet. Try again later.';
    if (problem.status === 'gone')
      return 'Its gallery page was unpublished, so this publishes a new one.';
    if (problem.status === 'duplicate')
      return 'This project is already in the gallery, just as it is now.';
    return problem.message
      ? `It couldn't be published: ${problem.message}`
      : "It couldn't be published. Please try again later.";
  });
</script>

<div class="flex w-full max-w-(--breakpoint-sm) flex-col gap-4 p-4 text-left">
  <!-- Always here, so screen readers announce what changes in it -->
  <p class="sr-only" role="status">
    {view === 'preparing' ? preparingText : busy ? stepText : ''}
  </p>

  {#if view === 'preparing'}
    <div
      class="flex w-full flex-col items-center justify-center gap-4 py-8 text-center"
      aria-hidden="true"
    >
      {#if preparing !== 'error'}
        <Spinner />
      {/if}
      <p>{preparingText}</p>
    </div>
  {:else if view === 'blocked'}
    <div class="flex flex-col items-center gap-2 py-6 text-center">
      {#if blocked === 'signed-out'}
        <p>
          Publishing to the gallery needs a free account, so you can update or
          unpublish your page later.
        </p>
        <p class="text-sm opacity-80">
          Without one, you can still share this project with Copy Link.
        </p>
      {:else}
        <p>Publishing to the gallery is paused right now. Try again later.</p>
      {/if}
    </div>
  {:else if view === 'sent' && sent}
    <div class="flex flex-col items-center gap-2 py-6 text-center">
      <CheckIcon class="text-success-700-300 size-8" />
      <h2 class="h4" tabindex="-1" bind:this={sentHeading}>
        {sent.updated ? 'Updated' : 'Published'}
      </h2>
      {#if sent.updated}
        <p class="text-sm opacity-80">
          Its gallery page shows the project as it is now. Its link stays the
          same.
        </p>
      {/if}
    </div>
  {:else}
    <!-- The project as its gallery card will show it -->
    <div
      class="bg-surface-50 dark:bg-surface-950 rounded-container flex gap-4 p-4"
      inert={busy}
    >
      <div class="pointer-events-none w-24 shrink-0 sm:w-32" aria-hidden="true">
        {#if previews.active}
          <previews.active.previewComponent />
        {/if}
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <RenameProject saveToName={view === 'form'} />
        {#if view === 'form' && (page ? page.showOwner : showOwner) && ownerName}
          <p class="text-sm">By {ownerName}</p>
        {/if}
      </div>
    </div>

    {#if view === 'form'}
      <p class="text-sm opacity-80">
        {page
          ? 'Updates its gallery page to the project as it is now. Its link stays the same.'
          : 'Publishes this project, as it is now, to the public Project Gallery. You can update or unpublish it later.'}
      </p>
      {#if !page}
        <AnonymousCheckbox
          bind:checked={showOwner}
          name={ownerName}
          disabled={busy}
        />
      {/if}
      {#if problem}
        <div class="text-error-700-300 flex flex-col gap-1" role="alert">
          <p>{problemText}</p>
          {#if problem.status === 'duplicate' && problem.link}
            <!-- eslint-disable svelte/no-navigation-without-resolve -- the gallery page's own address -->
            <a
              href={problem.link}
              target="_blank"
              rel="noreferrer"
              class="link w-fit"
            >
              {problem.title || 'View its gallery page'}
              <ExternalLinkIcon class="icon-sm inline" />
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {/if}
        </div>
      {/if}
    {/if}
  {/if}
</div>

<StickyPart position="bottom">
  {#if view === 'preparing'}
    <div class={FOOTER}>
      <button
        class="btn hover:preset-tonal-surface"
        onclick={() => dialog.close()}
        >{preparing === 'error' ? 'Close' : 'Cancel'}</button
      >
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
    </div>
  {:else if view === 'sent' && sent?.link}
    <div class={FOOTER}>
      <!-- eslint-disable svelte/no-navigation-without-resolve -- the gallery page's own address -->
      <a
        href={sent.link}
        target="_blank"
        rel="noreferrer"
        class="btn preset-filled-primary-500"
      >
        View Gallery Page
        <ExternalLinkIcon class="icon-sm" />
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  {:else if view === 'blocked'}
    <div class={FOOTER}>
      <button
        class="btn hover:preset-tonal-surface"
        onclick={() => dialog.close()}>Close</button
      >
      {#if blocked === 'signed-out' && __ACCOUNTS_ENABLED__}
        <!-- Back to this project after signing in -->
        <a
          class="btn preset-filled-primary-500"
          href={`${resolve('/auth/sign-in')}?redirect=${encodeURIComponent(
            href ?? project.url.href.replace(window.location.origin, ''),
          )}`}
          data-sveltekit-reload>Sign In or Create Account</a
        >
      {/if}
    </div>
  {:else if view === 'form' || view === 'checking'}
    <div class={FOOTER}>
      {#if busy && step}
        <p class="w-full text-center text-sm" aria-hidden="true">
          {stepText}
        </p>
      {/if}
      <button
        type="button"
        class="btn preset-filled-primary-500"
        disabled={!previews.active?.svg || view === 'checking' || busy}
        onclick={submit}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<SendIcon
          />{/if}
        {page ? 'Update' : 'Publish'}
      </button>
    </div>
  {/if}
</StickyPart>
