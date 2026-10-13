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

<!-- Publishes the open project to the Project Gallery: a snapshot of it as
it is now. It shows the project as its gallery card will (preview, name,
place and dates, and "By" with the account's name), then publishes it in place
and links to the new page. A project already published shows its page first,
with Publish New Version (choosing whether its old page is removed) and, for
the account's own pages, Unpublish. From My Projects, the saved project loads
behind the dialog first (with its weather, when that isn't kept with it). -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import CopyIcon from '#lib/components/CopyIcon.svelte';
  import RenameProject from '#lib/components/RenameProject.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import ShowOwnerToggle from '#lib/components/account/ShowOwnerToggle.svelte';
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
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
    LinkIcon,
    LoaderCircleIcon,
    EyeOffIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import StickyPart from './StickyPart.svelte';

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

  // Signed in with publishing from accounts on: the page is linked to the account
  let fromAccount = $state(false);
  // Until it's known whether it's from the account, it can't be sent: it would
  // otherwise go without the account (and a replaced page would stay)
  let accountChecked = $state(false);
  // Include it on the account's public gallery, starting from the last choice
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());
  type OwnPage = { postId: number; showOwner?: boolean; publishedAt: number };
  // The account's page a new version is published after, once it's known
  let oldPage = $state<OwnPage | null>(null);
  // Whether the new version takes the old page's place, or both stay
  let removeOld = $state(true);
  let replacePostId = $derived(
    oldPage && removeOld ? oldPage.postId : undefined,
  );
  // The account's newest page of this project
  let accountPage = $state<OwnPage | null>(null);
  // All of the account's pages of this project, which Unpublish removes
  let ownPostIds = $state<number[]>([]);

  // The page it has already: the account's, or one sent since the page opened
  const existingHref = $derived(
    accountPage
      ? resolve('/gallery/[id]', { id: String(accountPage.postId) })
      : project.gallery.href &&
          project.gallery.title &&
          project.gallery.title === locations.projectTitle
        ? project.gallery.href
        : '',
  );

  // Sent: the new page
  let sent = $state<Extract<GallerySendResult, { status: 'sent' }> | null>(
    null,
  );

  // Already published (and not asked from My Projects for a new one), until
  // Publish New Version is chosen
  let showExisting = $state(true);
  // Unpublish: asking first, then taken off
  let confirmingRemove = $state(false);
  let removed = $state(false);
  let removeError = $state('');
  const view = $derived(
    preparing
      ? 'preparing'
      : sent
        ? 'sent'
        : removed
          ? 'removed'
          : !accountChecked
            ? 'checking'
            : existingHref && showExisting && !request
              ? 'existing'
              : 'form',
  );

  onMount(async () => {
    window.addEventListener('pagehide', onpagehide);
    if (!(await loadProject())) return;
    void getWeather();
    try {
      await checkAccount();
    } finally {
      accountChecked = true;
    }
  });

  // Whether (and how) it's sent from the account, and its page there if any
  async function checkAccount() {
    if (!__ACCOUNTS_ENABLED__ || !account.summary) return;
    const { getGalleryPages } = await import('#lib/accounts/gallery.js');
    const gallery = await getGalleryPages();
    if (!gallery?.publishing) return;
    showOwner = gallery.settings.showOwnerDefault;
    if (request?.action === 'add' && request.showOwner !== undefined)
      showOwner = request.showOwner;
    if (request?.action === 'replace') {
      const old = gallery.posts.find((post) => post.postId === request.postId);
      if (old) {
        oldPage = old;
        showOwner = old.showOwner ?? showOwner;
      }
    }
    const own = gallery.posts
      .filter(
        (post) => post.projectId === project.id && post.kind !== 'palette',
      )
      .sort((a, b) => b.publishedAt - a.publishedAt);
    ownPostIds = own.map((post) => post.postId);
    if (own[0])
      accountPage = {
        postId: own[0].postId,
        showOwner: own[0].showOwner,
        publishedAt: own[0].publishedAt,
      };
    if (typeof gallery.name === 'string') serverName = gallery.name;
    fromAccount = true;
  }

  // Publish New Version: the project as it is now. After the account's own
  // page it asks whether to remove that one, and shows the name as it did.
  function publishNew() {
    if (accountPage) {
      oldPage = accountPage;
      showOwner = accountPage.showOwner ?? showOwner;
    }
    showExisting = false;
  }

  // Unpublish: every one of the account's pages of this project, so an older
  // one doesn't take the newest's place
  async function unpublish() {
    if (!ownPostIds.length || busy) return;
    busy = true;
    removeError = '';
    const { removeGalleryPage, GALLERY_PAGES_CHANGED } =
      await import('#lib/accounts/gallery.js');
    const results = await Promise.allSettled(
      ownPostIds.map((postId) => removeGalleryPage(postId)),
    );
    window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
    busy = false;
    if (results.some((result) => result.status === 'rejected')) {
      removeError =
        'Not all of its gallery pages could be removed. Try again, or remove them from My Projects.';
      ownPostIds = ownPostIds.filter(
        (_, i) => results[i].status === 'rejected',
      );
      return;
    }
    // The Project menu offers Publish to Gallery again
    const ids = new Set(ownPostIds.map(String));
    if (ids.has(project.gallery.href?.split('/').pop() ?? ''))
      project.gallery.href = '';
    removed = true;
    await tick();
    removedHeading?.focus();
  }

  const publishedOn = (time: number) =>
    new Date(time).toLocaleDateString(undefined, { dateStyle: 'medium' });

  let busy = $state(false);
  let step = $state<'image' | GallerySendStep | null>(null);
  const STEP_TEXT = {
    image: 'Drawing the preview image…',
    sending: 'Publishing… This can take a minute.',
    'removing-old': 'Removing the old page…',
  };
  let problem = $state<Exclude<GallerySendResult, { status: 'sent' }> | null>(
    null,
  );
  // The page's own link, for after it's sent
  let sentHeading = $state<HTMLElement>();
  let removedHeading = $state<HTMLElement>();
  const linkCopied = new Flash();

  async function submit() {
    const active = previews.active;
    if (!active?.svg || !active?.width || !active?.height || busy) return;
    busy = true;
    problem = null;
    try {
      if (fromAccount && !href) {
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
        fromAccount,
        showOwner: fromAccount && showOwner,
        name,
        replacePostId: fromAccount ? replacePostId : undefined,
        onStep: (next) => (step = next),
      });
      if (result.status === 'sent') {
        sent = result;
        await tick();
        sentHeading?.focus();
      } else {
        problem = result;
        // Its old page is gone: sending again adds a new one
        if ('oldRemoved' in result && result.oldRemoved) {
          oldPage = null;
          accountPage = null;
        }
      }
    } catch {
      problem = { status: 'error', message: '', oldRemoved: false };
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
    {view === 'preparing' ? preparingText : busy && step ? STEP_TEXT[step] : ''}
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
  {:else if view === 'removed'}
    <div class="flex flex-col items-center gap-3 py-4 text-center">
      <CheckIcon class="text-success-700-300 size-8" />
      <h2 class="h4" tabindex="-1" bind:this={removedHeading}>Unpublished</h2>
      <p class="text-sm">
        It’s off the gallery and the globe. Your project stays saved, and its
        link still works.
      </p>
    </div>
  {:else if view === 'sent' && sent}
    <div class="flex flex-col items-center gap-3 py-4 text-center">
      <CheckIcon class="text-success-700-300 size-8" />
      <h2 class="h4" tabindex="-1" bind:this={sentHeading}>Published</h2>
      {#if sent.oldRemoved !== null}
        <p class="text-sm">
          {sent.oldRemoved
            ? 'The old page was removed.'
            : 'The old page couldn’t be removed. You can unpublish it from My Projects, under Other gallery pages.'}
        </p>
      {/if}
      {#if sent.link}
        <div class="flex flex-wrap justify-center gap-2">
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
          <button
            type="button"
            class="btn hover:preset-tonal-surface"
            onclick={async () => {
              if (
                sent &&
                (await copyToClipboard(
                  sent.link,
                  'Link copied',
                  'Unable to copy to your clipboard',
                ))
              )
                linkCopied.trigger();
            }}
          >
            <CopyIcon copied={linkCopied.is()} icon={LinkIcon} />
            Copy Link
          </button>
        </div>
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
        {#if fromAccount && showOwner && ownerName}
          <p class="text-sm">By {ownerName}</p>
        {/if}
      </div>
    </div>

    {#if view === 'existing'}
      <p>
        {accountPage
          ? `Published ${publishedOn(accountPage.publishedAt)}.`
          : 'Published.'}
        The gallery shows the snapshot from then.
      </p>
      {#if confirmingRemove}
        <div
          class="bg-surface-100-900 rounded-container flex flex-col gap-3 p-4"
        >
          <p>
            Unpublish this project{ownPostIds.length > 1
              ? ` (all ${ownPostIds.length} of its gallery pages)`
              : ''}? It also comes off the globe. Your project stays saved, and
            its link still works.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn preset-filled-error-500 max-sm:w-full"
              onclick={unpublish}
              disabled={busy}
            >
              {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
              Unpublish
            </button>
            <button
              type="button"
              class="btn preset-tonal-surface max-sm:w-full"
              onclick={() => (confirmingRemove = false)}
              disabled={busy}>Cancel</button
            >
          </div>
        </div>
      {/if}
      {#if removeError}
        <p class="text-error-700-300" role="alert">{removeError}</p>
      {/if}
    {:else}
      <p>
        {#if oldPage}
          Publishes a new version of this project, as it is now.
        {:else}
          Publishes a snapshot of this project, as it is now, to the public
          <a href={resolve('/gallery')} target="_blank" class="link"
            >Project Gallery</a
          >.
        {/if}
      </p>
      {#if oldPage}
        <div class="bg-surface-100-900 rounded-container flex flex-col">
          <ToggleSwitch
            bare
            label="Remove the old page"
            details={removeOld
              ? `The page published ${publishedOn(oldPage.publishedAt)} is removed. Its link stops working, and its views are lost.`
              : 'Both pages stay in the gallery.'}
            bind:checked={removeOld}
            disabled={busy}
          />
        </div>
      {/if}
      {#if fromAccount}
        <ShowOwnerToggle
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
          {#if 'oldRemoved' in problem && problem.oldRemoved}
            <p>Its old page was removed.</p>
          {/if}
        </div>
      {/if}
    {/if}
  {/if}
</div>

<StickyPart position="bottom">
  {#if view === 'preparing'}
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
  {:else if view === 'existing'}
    <div class="flex flex-col items-center gap-2 p-2 py-4 text-center">
      <div class="flex flex-wrap justify-center gap-2">
        <!-- eslint-disable svelte/no-navigation-without-resolve -- the gallery page's own address -->
        <a
          href={existingHref}
          target="_blank"
          rel="noreferrer"
          class="btn hover:preset-tonal-surface"
        >
          View Gallery Page
          <ExternalLinkIcon class="icon-sm" />
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
        <button
          type="button"
          class="btn preset-filled-primary-500"
          onclick={publishNew}
          disabled={busy}
        >
          <SendIcon />
          Publish New Version
        </button>
      </div>
      {#if ownPostIds.length && !confirmingRemove}
        <button
          type="button"
          class="btn btn-sm hover:preset-tonal-error"
          onclick={() => (confirmingRemove = true)}
          disabled={busy}
        >
          <EyeOffIcon class="icon-sm" />
          Unpublish
        </button>
      {/if}
    </div>
  {:else if view === 'form' || view === 'checking'}
    <div class="flex flex-col items-center gap-2 p-2 py-4 text-center">
      <p class="text-sm" aria-hidden={busy}>
        {#if busy && step}
          {STEP_TEXT[step]}
        {:else if view === 'form' && !fromAccount}
          <span class="font-bold">It can’t be unpublished later.</span>
          {#if __ACCOUNTS_ENABLED__ && !account.summary}
            <a href={resolve('/account')} target="_blank" class="link"
              >Sign in</a
            > first if you might want to.
          {/if}
        {/if}
      </p>
      <button
        type="button"
        class="btn preset-filled-primary-500"
        disabled={!previews.active?.svg || view === 'checking' || busy}
        onclick={submit}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<SendIcon
          />{/if}
        {oldPage ? 'Publish New Version' : 'Publish'}
      </button>
    </div>
  {/if}
</StickyPart>
