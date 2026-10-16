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

<!-- Publish to Gallery / Edit Gallery Page: one dialog for everything a
project shares. Its gallery page (published, or updated in place when the
project changed: same link, views and settings), Anonymous, by the name, and,
for a project in the account with Ravelry connected, its Ravelry project: Also
post to Ravelry, or once posted its details, yarns and photos, all saved with
one Save. Once published, Unpublish is here too. Opened from the Share dialog
and from the gallery page itself (`onsaved`). Publishing needs an account; signed out, it says so with a way to
sign in. From My Library, the saved project loads behind the dialog first (with
its weather, when that isn't kept with it). -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import RenameProject from '#lib/components/RenameProject.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import AnonymousCheckbox from '#lib/components/account/AnonymousCheckbox.svelte';
  import UnpublishConfirm from '#lib/components/account/UnpublishConfirm.svelte';
  import RavelryFields, {
    type RavelryApplied,
  } from '#lib/components/account/RavelryFields.svelte';
  import { ravelryErrorMessage } from '#lib/accounts/ravelry.js';
  import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import {
    ProjectStorage,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import type { GalleryRequest } from '#lib/utils/gallery-request.js';
  import { inAccount } from '#lib/utils/open-ravelry.js';
  import { loadInPlace } from '#lib/utils/open-saved-project.js';
  import { svgToPNG } from '#lib/utils/preview-utils.svelte.js';
  import {
    sendToProjectGallery,
    type GallerySendResult,
    type GallerySendStep,
  } from '#lib/utils/project-utils.svelte.js';
  import {
    CheckIcon,
    EyeOffIcon,
    ExternalLinkIcon,
    LoaderCircleIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import StickyPart from './StickyPart.svelte';
  import type { Attachment } from 'svelte/attachments';

  let {
    request,
    href,
    onsaved,
    onunpublished,
  }: {
    // From My Library: add with a choice already made, or edit that page
    request?: GalleryRequest;
    // From My Projects: the saved project's link, loaded behind the dialog
    href?: string;
    // From its own gallery page, which shows what changed: Done closes, and
    // after Unpublish the dialog closes
    onsaved?: () => void;
    onunpublished?: () => void;
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
  // Its name on the page, starting from the last choice for a new page and
  // the page's own for an update
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  // Where "your gallery" links (null until a page shows the name)
  let publicId = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());
  // The project's gallery page, updated in place, if it has one
  type Page = {
    postId: number;
    showOwner: boolean;
    link: string | null;
    title: string;
  };
  let page = $state<Page | null>(null);
  // The project as saved here, which Ravelry needs (in the account)
  let item = $state<StoredProjectIndexItem | null>(null);

  // Unpublish is being asked, in place of the form
  let unpublishing = $state(false);

  // Done: what was published and saved
  let done = $state<{
    heading: string;
    gallery: Extract<GallerySendResult, { status: 'sent' }> | null;
    galleryLink: string;
    lines: string[];
    ravelry: RavelryApplied | null;
  } | null>(null);

  const view = $derived(
    done
      ? 'sent'
      : unpublishing && page
        ? 'unpublish'
        : preparing
          ? 'preparing'
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
    if (own) {
      page = {
        postId: own.postId,
        showOwner: !!own.showOwner,
        link: own.link ?? null,
        title: own.title,
      };
      showOwner = page.showOwner;
    }
    if (typeof gallery.name === 'string') serverName = gallery.name;
    publicId = gallery.settings.publicId ?? null;
    // Paused: a page can still be unpublished
    if (!gallery.publishing) {
      blocked = 'paused';
      return;
    }
    item =
      (await ProjectStorage.getIndex()).find((i) => i.id === project.id) ??
      null;
    if (!ravelryLinks.status) void ravelryLinks.load();
  }

  // Every footer: secondary actions, then the one filled primary
  const FOOTER =
    'bg-surface-50 dark:bg-surface-950 flex flex-wrap items-center justify-center gap-2 px-2 py-3 sm:px-4';

  // ---- The gallery page
  // Its name as shown: the saved one, which Rename here changes too
  let name = $state('');
  $effect(() => {
    // Read again after a rename (the link's name changes with it)
    void project.linkName;
    void ProjectStorage.getById(project.id).then(
      (stored) => (name = stored ? (stored.name ?? '') : project.linkName),
    );
  });
  /** The parts of a project link that make the project */
  const linkKey = (link: string) => {
    try {
      const url = new URL(link, window.location.origin);
      url.searchParams.delete('m');
      return url.search + url.hash;
    } catch {
      return link;
    }
  };
  // Published or updated already, and the gallery page shows this project
  let galleryDone = $state(false);
  const galleryUpToDate = $derived(
    galleryDone ||
      Boolean(
        page &&
        page.link &&
        linkKey(page.link) === linkKey(project.url.href) &&
        (!name || name === page.title),
      ),
  );
  // Its name shown or not, changed here, for a page there is
  const ownerChanged = $derived(!!page && showOwner !== page.showOwner);

  // ---- Ravelry: for a project in the account, with Ravelry connected
  const linked = $derived(ravelryLinks.links.has(project.id));
  const ravelryReady = $derived(
    !!item && inAccount(item) && ravelryLinks.connected,
  );
  let alsoPost = $state(false);
  let ravelryFields = $state<RavelryFields>();
  let ravelryChanged = $state(false);
  let ravelryCanSave = $state(false);
  let ravelryPictureNeeded = $state(false);
  // Said once, when it turns out it was deleted on Ravelry
  let ravelryNotice = $state('');
  // The Ravelry part shows: posted (unless Anonymous is ticked, which unlinks
  // it), or Also post to Ravelry is ticked
  const ravelryOn = $derived(
    ravelryReady && showOwner && (linked || alsoPost) && !preparing,
  );
  // Unlinked by saving as Anonymous
  const unlinksRavelry = $derived(linked && !showOwner);
  const ravelryLink = $derived(ravelryLinks.links.get(project.id));

  // Unlink, asked first, beside "On Ravelry"
  let confirmingUnlink = $state(false);
  let unlinking = $state(false);
  let unlinkError = $state('');
  let unlinkButton = $state<HTMLButtonElement>();
  /** The confirm's first button takes the focus, as the one that asked is gone */
  const takeFocus: Attachment<HTMLButtonElement> = (button) => {
    button.focus({ preventScroll: true });
  };
  async function unlink() {
    unlinking = true;
    unlinkError = '';
    try {
      const { unlinkRavelryProject } = await import('#lib/accounts/ravelry.js');
      await unlinkRavelryProject(project.id);
      // The Ravelry part goes, and Also post to Ravelry is offered again
      ravelryLinks.remove(project.id);
      confirmingUnlink = false;
    } catch {
      unlinkError = 'It couldn’t be unlinked. Try again later.';
    } finally {
      unlinking = false;
    }
  }
  async function keepLinked() {
    confirmingUnlink = false;
    await tick();
    unlinkButton?.focus({ preventScroll: true });
  }

  const nothingChanged = $derived(
    !!page &&
      galleryUpToDate &&
      !ownerChanged &&
      !(ravelryOn && ravelryChanged),
  );

  let busy = $state(false);
  let step = $state<'image' | GallerySendStep | null>(null);
  let ravelryStep = $state('');
  const STEP_TEXT = {
    image: 'Drawing the preview image…',
    sending: 'Publishing… This can take a minute.',
  };
  let problem = $state<Exclude<GallerySendResult, { status: 'sent' }> | null>(
    null,
  );
  let ravelryError = $state('');
  let ownerError = $state('');
  // The result's heading, for after it's sent
  let sentHeading = $state<HTMLElement>();
  const stepText = $derived(ravelryStep || (step ? STEP_TEXT[step] : '') || '');

  const canSubmit = $derived(
    view === 'form' &&
      !busy &&
      !!previews.active?.svg &&
      !nothingChanged &&
      (!ravelryOn || ravelryCanSave),
  );

  const submitText = $derived(
    !page && !galleryDone
      ? ravelryOn
        ? 'Publish and Post to Ravelry'
        : 'Publish'
      : !page
        ? 'Post to Ravelry'
        : ravelryOn && !linked
          ? 'Save and Post to Ravelry'
          : 'Save',
  );

  // What Save does, said beside it
  const saveSummary = $derived(
    nothingChanged
      ? 'Everything is up to date.'
      : !page && !galleryDone
        ? ravelryOn
          ? 'Publishes it to the public Project Gallery, then posts it to Ravelry.'
          : 'Publishes it, as it is now, to the public Project Gallery. You can update or unpublish it later.'
        : !page
          ? ''
          : galleryUpToDate
            ? 'Its gallery page is up to date.'
            : 'Updates its gallery page to the project as it is now. Its link stays the same.',
  );

  async function drawPNG() {
    const active = previews.active;
    if (!active?.svg || !active.width || !active.height)
      throw new Error('The picture isn’t ready');
    const img = await svgToPNG({
      svgNode: active.svg,
      width: active.width,
      height: active.height,
      download: false,
    });
    document.getElementById('temporary-canvas')?.remove();
    return img;
  }

  // What's done so far, kept across a retry
  let sentSoFar: Extract<GallerySendResult, { status: 'sent' }> | null = null;
  let lines: string[] = [];

  async function submit() {
    if (!canSubmit) return;
    busy = true;
    problem = null;
    ravelryError = ownerError = '';
    const withRavelry = ravelryOn;
    try {
      if (!href) {
        // Published from the account, it's kept there too, next to its gallery page
        const { saveOpenProject } =
          await import('#lib/storage/autosave.svelte.js');
        await saveOpenProject();
      }
      // The name it has now, which may have just been changed here
      const stored = await ProjectStorage.getById(project.id);
      const savedName = stored ? (stored.name ?? '') : project.linkName;

      // Anonymous or not: first, so Ravelry can link to the page under the name
      if (page && ownerChanged) {
        const { galleryPages } =
          await import('#lib/accounts/gallery-pages.svelte.js');
        try {
          await galleryPages.setShowOwner(page.postId, showOwner, {
            unlinkRavelry: unlinksRavelry,
          });
        } catch {
          ownerError =
            'Its name on the page couldn’t be changed. Try again later.';
          return;
        }
        if (unlinksRavelry) {
          ravelryLinks.remove(project.id);
          lines.push('Unlinked it from Ravelry (the Ravelry project stays)');
        }
        lines.push(
          showOwner ? 'Shows your name on its page' : 'Made its page anonymous',
        );
        page.showOwner = showOwner;
      }

      const needPicture =
        !galleryUpToDate || (withRavelry && ravelryPictureNeeded);
      let img: string | null = null;
      if (needPicture) {
        step = 'image';
        img = await drawPNG();
      }

      if (!galleryUpToDate && img) {
        const result = await sendToProjectGallery(img, {
          showOwner,
          name: savedName,
          postId: page?.postId,
          onStep: (next) => (step = next),
        });
        step = null;
        if (result.status === 'sent') {
          sentSoFar = result;
          galleryDone = true;
          lines.push(
            result.updated
              ? 'Updated its gallery page. Its link stays the same.'
              : 'Published its gallery page',
          );
        } else if (result.status === 'duplicate') {
          // Already just like this
          galleryDone = true;
        } else {
          problem = result;
          // Unpublished elsewhere: sending again publishes a new page
          if (result.status === 'gone') page = null;
          return;
        }
      }

      let ravelry: RavelryApplied | null = null;
      if (withRavelry && ravelryFields) {
        const picture =
          img && ravelryPictureNeeded ? await (await fetch(img)).blob() : null;
        try {
          ravelry = await ravelryFields.apply({
            picture,
            onStep: (text) => (ravelryStep = text),
          });
        } catch (e) {
          ravelryError =
            (galleryDone && !page
              ? 'Its gallery page is published, but it isn’t on Ravelry yet. '
              : (e as { partly?: boolean }).partly
                ? 'Part of this is saved on Ravelry; the rest wasn’t. '
                : '') + ravelryErrorMessage(e);
          return;
        }
      }

      done = {
        heading: sentSoFar && !sentSoFar.updated ? 'Published' : 'Saved',
        gallery: sentSoFar,
        galleryLink:
          sentSoFar?.link ??
          (page ? resolve('/gallery/[id]', { id: String(page.postId) }) : ''),
        lines: [
          ...lines,
          ...(ravelry?.summary ?? []).map((line) => `Ravelry: ${line}`),
        ],
        ravelry,
      };
      if (page) onsaved?.();
      await tick();
      sentHeading?.focus();
    } catch {
      problem = { status: 'error', message: '' };
    } finally {
      busy = false;
      step = null;
      ravelryStep = '';
    }
  }

  // ---- Unpublish, asked first in place of the form
  let unpublishButton = $state<HTMLButtonElement>();
  // On Ravelry when asked (unpublishing unlinks it)
  let unpublishLinked = false;
  function askUnpublish() {
    unpublishLinked = linked;
    unpublishing = true;
  }
  async function unpublished() {
    unpublishing = false;
    if (onunpublished) {
      dialog.close();
      onunpublished();
      return;
    }
    done = {
      heading: 'Unpublished',
      gallery: null,
      galleryLink: '',
      lines: [
        'Its gallery page link no longer works',
        ...(unpublishLinked
          ? ['Unlinked it from Ravelry (the Ravelry project stays)']
          : []),
      ],
      ravelry: null,
    };
    page = null;
    await tick();
    sentHeading?.focus();
  }
  async function keepPublished() {
    unpublishing = false;
    await tick();
    unpublishButton?.focus();
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

{#snippet yourGallery()}
  {#if publicId}
    <a
      class="anchor"
      href={resolve('/gallery/by/[ownerId]', { ownerId: publicId })}
      target="_blank"
      >your gallery<span class="sr-only"> (opens in a new tab)</span></a
    >
  {:else}
    your gallery
  {/if}
{/snippet}

<!-- Medium on wide screens, so the Ravelry part has room (less a scroll bar);
in the Project menu's side panel, its width, so nothing scrolls sideways -->
<div
  class={[
    'flex w-full flex-col gap-4 p-4 text-left',
    dialog.options.placement !== 'side' && 'lg:w-[46.5rem]',
  ]}
>
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
  {:else if view === 'unpublish' && page}
    <UnpublishConfirm
      kind="project"
      postId={page.postId}
      title={page.title}
      onRavelry={linked}
      ondone={unpublished}
      oncancel={keepPublished}
    />
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
  {:else if view === 'sent' && done}
    <div class="flex flex-col items-center gap-2 py-6 text-center">
      <CheckIcon class="text-success-700-300 size-8" aria-hidden="true" />
      <h2 class="h4" tabindex="-1" bind:this={sentHeading}>
        {done.heading}
      </h2>
      {#if done.lines.length}
        <ul class="flex flex-col gap-1 text-sm">
          {#each done.lines as line (line)}
            <li>{line}</li>
          {/each}
        </ul>
      {/if}
      {#if done.ravelry?.processing}
        <p class="text-sm opacity-80">
          Ravelry is still adding a photo. It shows up there in a moment.
        </p>
      {/if}
    </div>
  {:else}
    <!-- The project as its gallery card will show it -->
    <div
      class="bg-surface-50 dark:bg-surface-950 rounded-container flex gap-4 p-4"
      inert={busy}
    >
      <div class="pointer-events-none w-24 shrink-0 sm:w-40" aria-hidden="true">
        {#if previews.active}
          <previews.active.previewComponent />
        {/if}
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <RenameProject saveToName={view === 'form'} />
        {#if view === 'form'}
          <!-- Its name on the page, and the choice to leave it off, together;
          then Ravelry, which needs the name -->
          <p class="text-sm" id="gallery-owner-line">
            {#if !showOwner}
              No name; not in {@render yourGallery()}
            {:else if ownerName}
              By {ownerName} · in {@render yourGallery()}
            {:else}
              <span class="text-warning-700-300"
                >Add a display name to be credited</span
              >
            {/if}
          </p>
          <AnonymousCheckbox
            bind:checked={showOwner}
            name={ownerName}
            disabled={busy}
            detail={false}
            describedby="gallery-owner-line"
          />
          {#if ravelryReady}
            {#if linked && showOwner && ravelryLink}
              {#if confirmingUnlink}
                <div
                  class="flex flex-col gap-2"
                  role="group"
                  aria-label="Unlink"
                >
                  <p class="text-sm">
                    Unlink from Ravelry? The project stays on Ravelry, but it’s
                    no longer updated from here, and its photos leave its
                    gallery page.
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="btn preset-filled-error-500"
                      onclick={unlink}
                      disabled={unlinking}
                      {@attach takeFocus}
                      >{#if unlinking}<LoaderCircleIcon
                          class="animate-spin"
                        />{/if}Unlink</button
                    >
                    <button
                      type="button"
                      class="btn preset-tonal-surface"
                      onclick={keepLinked}
                      disabled={unlinking}>Keep Linked</button
                    >
                  </div>
                </div>
              {:else}
                <p class="flex flex-wrap items-center gap-x-1.5 text-sm">
                  <span
                    >On Ravelry{ravelryLink.photos.length
                      ? ` · ${ravelryLink.photos.length} ${ravelryLink.photos.length === 1 ? 'photo' : 'photos'}`
                      : ''}</span
                  >
                  <span aria-hidden="true">·</span>
                  <!-- eslint-disable svelte/no-navigation-without-resolve -- Ravelry's site -->
                  <a
                    class="anchor"
                    href={ravelryLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    >View<ExternalLinkIcon
                      class="icon-sm ml-0.5 inline"
                      aria-hidden="true"
                    /><span class="sr-only">
                      on Ravelry (opens in a new tab)</span
                    ></a
                  >
                  <!-- eslint-enable svelte/no-navigation-without-resolve -->
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    class="anchor"
                    bind:this={unlinkButton}
                    disabled={busy}
                    onclick={() => (confirmingUnlink = true)}
                    >Unlink<span class="sr-only"> from Ravelry</span>…</button
                  >
                </p>
              {/if}
              {#if unlinkError}
                <p class="text-error-700-300 text-sm" role="alert">
                  {unlinkError}
                </p>
              {/if}
            {:else if linked}
              <p class="text-warning-700-300 text-xs">
                It’s on Ravelry, which links to this page under your name.
                Saving it as Anonymous unlinks it; the Ravelry project stays.
              </p>
            {:else if showOwner}
              <label class="flex items-start gap-3">
                <input
                  type="checkbox"
                  class="checkbox mt-0.5 shrink-0"
                  bind:checked={alsoPost}
                  disabled={busy}
                  aria-describedby="also-post-detail"
                />
                <span class="flex flex-1 flex-col">
                  <span>Also post to Ravelry</span>
                  <span class="text-xs opacity-70" id="also-post-detail"
                    >With its yarns and photos, linking to this page</span
                  >
                </span>
              </label>
            {/if}
          {:else if item && inAccount(item) && ravelryLinks.status?.available && !ravelryLinks.connected && showOwner}
            <p class="text-xs opacity-70">
              <a class="anchor" href={resolve('/account')}>Connect Ravelry</a> in
              your Account to post there too.
            </p>
          {/if}
        {/if}
      </div>
    </div>

    {#if view === 'form'}
      {#if ownerError}
        <p class="text-error-700-300 text-sm" role="alert">{ownerError}</p>
      {/if}
      {#if problem}
        <p class="text-error-700-300 text-sm" role="alert">{problemText}</p>
      {/if}

      {#if ravelryNotice}
        <p class="text-sm" role="status">{ravelryNotice}</p>
      {/if}
      {#if ravelryOn}
        <section class="flex flex-col gap-4" aria-label="Ravelry">
          <RavelryFields
            bind:this={ravelryFields}
            onstate={(state) => {
              ravelryChanged = state.changed;
              ravelryCanSave = state.canSave;
              ravelryPictureNeeded = state.pictureNeeded;
            }}
            projectId={project.id}
            href={project.url.href}
            name={name || item?.meta.title || 'Untitled Project'}
            disabled={busy}
            ongone={(message) => {
              ravelryNotice = message;
              alsoPost = false;
            }}
          />
          {#if ravelryError}
            <p class="text-error-700-300 text-sm" role="alert">
              {ravelryError}
            </p>
          {/if}
        </section>
      {/if}
    {/if}
  {/if}
</div>

<StickyPart position="bottom">
  {#if view === 'preparing'}
    <div class={FOOTER}>
      {#if preparing === 'error' && page}
        <!-- Unpublishing needs only the page -->
        <button
          type="button"
          class="btn hover:preset-tonal-surface me-auto"
          bind:this={unpublishButton}
          onclick={askUnpublish}
        >
          <EyeOffIcon aria-hidden="true" />Unpublish…
        </button>
      {/if}
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
  {:else if view === 'sent' && done}
    <div class={FOOTER}>
      <!-- eslint-disable svelte/no-navigation-without-resolve -- the pages' own addresses -->
      {#if done.ravelry?.url}
        <a
          href={done.ravelry.url}
          target="_blank"
          rel="noopener noreferrer"
          class="btn preset-tonal-surface"
        >
          View on Ravelry
          <ExternalLinkIcon class="icon-sm" aria-hidden="true" /><span
            class="sr-only"
          >
            (opens in a new tab)</span
          >
        </a>
      {/if}
      {#if done.galleryLink && !onsaved}
        <a
          href={done.galleryLink}
          target="_blank"
          rel="noreferrer"
          class="btn preset-filled-primary-500"
        >
          View Gallery Page
          <ExternalLinkIcon class="icon-sm" aria-hidden="true" /><span
            class="sr-only"
          >
            (opens in a new tab)</span
          >
        </a>
      {:else}
        <!-- Unpublished, or already on its page -->
        <button
          type="button"
          class="btn preset-filled-primary-500"
          onclick={() => dialog.close()}>Done</button
        >
      {/if}
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  {:else if view === 'blocked'}
    <div class={FOOTER}>
      {#if blocked === 'paused' && page}
        <button
          type="button"
          class="btn hover:preset-tonal-surface me-auto"
          bind:this={unpublishButton}
          onclick={askUnpublish}
        >
          <EyeOffIcon aria-hidden="true" />Unpublish…
        </button>
      {/if}
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
      {#if busy && stepText}
        <p class="w-full text-center text-sm" aria-hidden="true">
          {stepText}
        </p>
      {:else if view === 'form' && saveSummary}
        <!-- What Save does, beside it -->
        <p
          class="w-full text-center text-sm opacity-80 sm:text-right"
          id="save-summary"
        >
          {saveSummary}
        </p>
      {/if}
      {#if page && view === 'form' && !busy}
        <button
          type="button"
          class="btn hover:preset-tonal-surface me-auto"
          bind:this={unpublishButton}
          onclick={askUnpublish}
        >
          <EyeOffIcon aria-hidden="true" />Unpublish…
        </button>
      {/if}
      <button
        type="button"
        class="btn preset-filled-primary-500"
        disabled={!canSubmit}
        aria-describedby={saveSummary && !busy ? 'save-summary' : undefined}
        onclick={submit}
      >
        {#if busy}<LoaderCircleIcon
            class="animate-spin"
          />{:else if !page}<SendIcon aria-hidden="true" />{/if}
        {submitText}
      </button>
    </div>
  {/if}
</StickyPart>
