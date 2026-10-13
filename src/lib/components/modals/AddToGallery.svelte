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
behind the dialog first (with its weather, when that isn't kept with it).
Each gauge's yarn palette can be shared to the palette gallery with it, by
choice (guests too: it's the only way they can share a palette). -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import CopyIcon from '#lib/components/CopyIcon.svelte';
  import RenameProject from '#lib/components/RenameProject.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import Turnstile from '#lib/components/Turnstile.svelte';
  import ShowOwnerToggle from '#lib/components/account/ShowOwnerToggle.svelte';
  import UnpublishVersions from '#lib/components/account/UnpublishVersions.svelte';
  import GalleryPageList from '#lib/components/account/GalleryPageList.svelte';
  import { account } from '#lib/accounts/summary.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { PaletteStorage } from '#lib/storage/palettes.svelte.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { colorsToPaletteCode } from '#lib/utils/color-utils.js';
  import { cleanName } from '#lib/utils/string-utils.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
  import type { GalleryRequest } from '#lib/utils/gallery-request.js';
  import { loadInPlace } from '#lib/utils/open-saved-project.js';
  import { svgToPNG } from '#lib/utils/preview-utils.svelte.js';
  import {
    sendToProjectGallery,
    type GallerySendResult,
    type GallerySendStep,
    type SharePaletteChoice,
  } from '#lib/utils/project-utils.svelte.js';
  import {
    CheckIcon,
    ExternalLinkIcon,
    LinkIcon,
    LoaderCircleIcon,
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
  type OwnPage = {
    postId: number;
    showOwner?: boolean;
    publishedAt: number;
    link?: string | null;
  };
  // The account's pages of this project, newest first
  let ownPages = $state<OwnPage[]>([]);
  let accountPage = $derived(ownPages[0] ?? null);
  // Publishing a new version, after the pages it has
  let newVersion = $state(false);
  // Its versions to unpublish once the new one is in (the latest, at first)
  let unpublishIds = $state<number[]>([]);
  // The newest of them takes the new page's place (it may be the one the
  // gallery says is the same); the rest come off after
  let replacePostId = $derived(
    ownPages.find((page) => unpublishIds.includes(page.postId))?.postId,
  );
  // Of the rest: how many came off, and whether any couldn't
  let extrasRemoved = $state(0);
  let extrasFailed = $state(false);

  // The pages it has already: the account's, or one sent since the page opened
  const existingPages = $derived(
    ownPages.length
      ? ownPages.map((page) => ({
          postId: page.postId,
          publishedAt: page.publishedAt,
          link: page.link,
          showOwner: page.showOwner,
          href: resolve('/gallery/[id]', { id: String(page.postId) }),
        }))
      : project.gallery.href &&
          project.gallery.title &&
          project.gallery.title === locations.projectTitle
        ? [{ postId: 0, href: project.gallery.href }]
        : [],
  );

  // Sent: the new page
  let sent = $state<Extract<GallerySendResult, { status: 'sent' }> | null>(
    null,
  );

  // Already published (and not asked from My Projects for a new one), until
  // Publish New Version is chosen
  let showExisting = $state(true);
  // Every page unpublished, here
  let removed = $state(false);
  const view = $derived(
    preparing
      ? 'preparing'
      : sent
        ? 'sent'
        : removed
          ? 'removed'
          : !accountChecked
            ? 'checking'
            : existingPages.length && showExisting && !request
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
      newVersion = true;
      if (old) {
        unpublishIds = [old.postId];
        showOwner = old.showOwner ?? showOwner;
      }
    }
    const own = gallery.posts
      .filter(
        (post) => post.projectId === project.id && post.kind !== 'palette',
      )
      .sort((a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId);
    ownPages = own.map(({ postId, showOwner, publishedAt, link }) => ({
      postId,
      showOwner,
      publishedAt,
      link,
    }));
    if (typeof gallery.name === 'string') serverName = gallery.name;
    fromAccount = true;
  }

  // Publish New Version: the project as it is now. With the account's own
  // pages, it asks which to unpublish (the latest, at first), and shows the
  // name as the latest did.
  function publishNew() {
    newVersion = true;
    if (accountPage) {
      unpublishIds = [accountPage.postId];
      showOwner = accountPage.showOwner ?? showOwner;
    }
    showExisting = false;
  }

  // Show the name on one of the account's pages, or not. Throws when it can't.
  async function setPageShowOwner(postId: number, next: boolean) {
    const { setGalleryPageShowOwner, GALLERY_PAGES_CHANGED } =
      await import('#lib/accounts/gallery.js');
    await setGalleryPageShowOwner(postId, next);
    ownPages = ownPages.map((page) =>
      page.postId === postId ? { ...page, showOwner: next } : page,
    );
    window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
  }

  // Unpublish one of the account's pages. Throws when it can't.
  async function removePage(postId: number) {
    const { removeGalleryPage, GALLERY_PAGES_CHANGED } =
      await import('#lib/accounts/gallery.js');
    await removeGalleryPage(postId);
    ownPages = ownPages.filter((page) => page.postId !== postId);
    window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
    // The Project menu offers Publish to Gallery again
    if (project.gallery.href?.split('/').pop() === String(postId))
      project.gallery.href = '';
    if (!ownPages.length) {
      removed = true;
      await tick();
      removedHeading?.focus();
    }
  }

  // Palettes to share with it: each gauge with yarn colors (the palette
  // gallery shows only those), by its place in gauges.allCreated
  const MAX_PALETTE_NAME_LENGTH = 80;
  let shareable = $derived(
    gauges.allCreated
      .map((gauge, index) => ({
        index,
        colors: (gauge.colors ?? []) as Color[],
        gaugeName: String(gauge.label ?? 'Gauge'),
      }))
      .filter(({ colors }) =>
        colors.some((color) => color?.brandName && color?.yarnName),
      ),
  );
  let shareChecked = $state<Record<number, boolean>>({});
  // Names typed; until then, the project's name and the gauge's
  let shareNames = $state<Record<number, string>>({});
  const projectLabel = $derived(
    (project.linkName || locations.projectTitle || 'Project').trim(),
  );
  const defaultPaletteName = (gaugeName: string) =>
    cleanName(`${projectLabel} – ${gaugeName}`, MAX_PALETTE_NAME_LENGTH);
  const paletteName = (option: { index: number; gaugeName: string }) =>
    shareNames[option.index] ?? defaultPaletteName(option.gaugeName);
  let shareChoices = $derived(
    shareable.filter((option) => shareChecked[option.index]),
  );
  let shareNamesMissing = $derived(
    shareChoices.some(
      (option) => !cleanName(paletteName(option), MAX_PALETTE_NAME_LENGTH),
    ),
  );

  // The chosen palettes, named; from the account, each with its saved palette
  // when there is one, so My Projects shows its page on that row
  async function sharePaletteChoices(): Promise<SharePaletteChoice[]> {
    if (!shareChoices.length) return [];
    const saved = fromAccount
      ? await PaletteStorage.list().catch(() => [])
      : [];
    return shareChoices.map((option) => {
      const code = colorsToPaletteCode(option.colors);
      return {
        gaugeIndex: option.index,
        title: cleanName(paletteName(option), MAX_PALETTE_NAME_LENGTH),
        paletteId: saved.find((palette) => palette.code === code)?.id,
      };
    });
  }

  // Why a palette wasn't shared, as people would say it
  const skippedText = (reason: string) =>
    reason === 'duplicate'
      ? fromAccount
        ? 'You’ve published it already.'
        : 'It’s in the gallery already.'
      : reason === 'title'
        ? 'Its name can’t be used.'
        : reason === 'link'
          ? 'It couldn’t be matched to the project.'
          : reason === 'limit'
            ? 'You’ve shared as many palettes as you can today.'
            : 'It couldn’t be shared. You can try again from Save & Export.';

  // Every footer: secondary actions, then the one filled primary
  const FOOTER =
    'bg-surface-50 dark:bg-surface-950 flex flex-wrap items-center justify-center gap-2 px-2 py-3 sm:px-4';

  let busy = $state(false);
  let step = $state<'image' | GallerySendStep | null>(null);
  const STEP_TEXT = {
    image: 'Drawing the preview image…',
    checking: 'Checking you’re not a robot…',
    sending: 'Publishing… This can take a minute.',
    'removing-old': 'Removing the old page…',
  };
  let problem = $state<Exclude<GallerySendResult, { status: 'sent' }> | null>(
    null,
  );
  // The page's own link, for after it's sent
  let sentHeading = $state<HTMLElement>();
  let removedHeading = $state<HTMLElement>();
  // Cloudflare is asking the person to do something
  let challenge = $state(false);
  const stepText = $derived(
    step === 'checking' && challenge
      ? 'Complete the check below to publish.'
      : step
        ? STEP_TEXT[step]
        : '',
  );
  const linkCopied = new Flash();
  // Checks a submission without the account isn't from a robot
  let turnstile = $state<Turnstile>();

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
      const sharePalettes = await sharePaletteChoices();
      const result = await sendToProjectGallery(img, {
        sharePalettes,
        fromAccount,
        showOwner: fromAccount && showOwner,
        name,
        replacePostId: fromAccount ? replacePostId : undefined,
        getGuestToken: async () => {
          if (!turnstile) throw new Error('No Turnstile');
          return turnstile.getToken();
        },
        onStep: (next) => (step = next),
      });
      if (result.status === 'sent') {
        // The other versions chosen, now that the new one is in
        if (fromAccount && result.oldRemoved !== false) {
          const extras = unpublishIds.filter((id) => id !== replacePostId);
          if (extras.length) {
            const { removeGalleryPage, GALLERY_PAGES_CHANGED } =
              await import('#lib/accounts/gallery.js');
            const results = await Promise.allSettled(
              extras.map((id) => removeGalleryPage(id)),
            );
            extrasRemoved = results.filter(
              (r) => r.status === 'fulfilled',
            ).length;
            extrasFailed = extrasRemoved < extras.length;
            window.dispatchEvent(new Event(GALLERY_PAGES_CHANGED));
          }
        }
        sent = result;
        await tick();
        sentHeading?.focus();
      } else {
        problem = result;
        // Its old page is gone: sending again adds a new one
        if ('oldRemoved' in result && result.oldRemoved) {
          const gone = replacePostId;
          unpublishIds = unpublishIds.filter((id) => id !== gone);
          ownPages = ownPages.filter((page) => page.postId !== gone);
        }
      }
    } catch {
      problem = { status: 'error', message: '', oldRemoved: false };
    } finally {
      busy = false;
      step = null;
      challenge = false;
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
  {:else if view === 'removed'}
    <div class="flex flex-col items-center gap-2 py-6 text-center">
      <CheckIcon class="text-success-700-300 size-8" />
      <h2 class="h4" tabindex="-1" bind:this={removedHeading}>Unpublished</h2>
      <p class="text-sm opacity-80">
        It’s off the gallery and the globe. Your project stays saved, and links
        you’ve shared to the project still work.
      </p>
    </div>
  {:else if view === 'sent' && sent}
    <div class="flex flex-col items-center gap-2 py-6 text-center">
      <CheckIcon class="text-success-700-300 size-8" />
      <h2 class="h4" tabindex="-1" bind:this={sentHeading}>Published</h2>
      {#if sent.palettes === null}
        <p class="text-sm opacity-80">
          Its palettes weren’t shared: the gallery can’t do that yet.
        </p>
      {:else if sent.palettes}
        <ul class="flex flex-col gap-1 text-left text-sm" aria-label="Palettes">
          {#each sent.palettes.created as palette (palette.id)}
            <li>
              Shared
              <a
                href={resolve('/gallery/palette/[id]', {
                  id: String(palette.id),
                })}
                target="_blank"
                class="link">“{palette.title}”</a
              >
              to the palette gallery.
            </li>
          {/each}
          {#each sent.palettes.skipped as palette, i (i)}
            <li>
              “{palette.title}” wasn’t shared. {skippedText(palette.reason)}
              {#if palette.id}
                <a
                  href={resolve('/gallery/palette/[id]', {
                    id: String(palette.id),
                  })}
                  target="_blank"
                  class="link">View it</a
                >
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
      {#if sent.oldRemoved !== null}
        {@const count = (sent.oldRemoved ? 1 : 0) + extrasRemoved}
        <p class="text-sm opacity-80">
          {#if count}
            {count === 1
              ? 'The older version was unpublished.'
              : `${count} older versions were unpublished.`}
          {/if}
          {#if sent.oldRemoved === false || extrasFailed}
            Some couldn’t be unpublished. You can unpublish them from My
            Projects.
          {/if}
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
        {#if view === 'form' && fromAccount && showOwner && ownerName}
          <p class="text-sm">By {ownerName}</p>
        {/if}
      </div>
    </div>

    {#if view === 'existing'}
      <p class="text-sm opacity-80">
        Each gallery page is a snapshot of the project from when it was
        published.
      </p>
      <GalleryPageList
        pages={existingPages}
        kind="project"
        {ownerName}
        onremove={ownPages.length ? removePage : undefined}
        onshowowner={ownPages.length ? setPageShowOwner : undefined}
      />
    {:else}
      <p class="text-sm opacity-80">
        {newVersion
          ? 'Publishes a new version of this project, as it is now.'
          : 'Publishes a snapshot of this project, as it is now, to the public Project Gallery.'}
      </p>
      {#if newVersion && ownPages.length}
        <UnpublishVersions
          versions={ownPages}
          bind:selected={unpublishIds}
          disabled={busy}
        />
      {/if}
      {#if fromAccount}
        <ShowOwnerToggle
          bind:checked={showOwner}
          name={ownerName}
          disabled={busy}
        />
      {/if}
      {#if shareable.length}
        <fieldset class="flex flex-col gap-3" disabled={busy}>
          <legend class="mb-2 font-bold">
            Also share {shareable.length === 1 ? 'its palette' : 'its palettes'}
            to the
            <a
              href="{resolve('gallery')}?view=yarn-palettes"
              target="_blank"
              class="link">Yarn Palette Gallery</a
            >
          </legend>
          {#each shareable as option (option.index)}
            <div class="flex flex-col gap-1">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  class="checkbox"
                  checked={Boolean(shareChecked[option.index])}
                  onchange={(event) =>
                    (shareChecked[option.index] = event.currentTarget.checked)}
                />
                <span>{option.gaugeName}</span>
              </label>
              <div class="pl-7" aria-hidden="true">
                <PaletteStrip colors={option.colors} height="12px" />
              </div>
              {#if shareChecked[option.index]}
                <label class="label pl-7">
                  <span class="label-text"
                    >Palette name<span class="sr-only">
                      for {option.gaugeName}</span
                    ></span
                  >
                  <input
                    type="text"
                    class="input"
                    autocomplete="off"
                    maxlength={MAX_PALETTE_NAME_LENGTH}
                    required
                    value={paletteName(option)}
                    oninput={(event) =>
                      (shareNames[option.index] = event.currentTarget.value)}
                  />
                </label>
              {/if}
            </div>
          {/each}
        </fieldset>
      {/if}
      <!-- Shows only when Cloudflare needs you to do something; outside the
      inert card, since that can be while it's sending -->
      <Turnstile
        bind:this={turnstile}
        oninteractive={(needed) => (challenge = needed)}
      />
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
      <button
        type="button"
        class="btn hover:preset-tonal-surface"
        onclick={async () => {
          if (
            sent &&
            (await copyToClipboard(
              sent.link,
              'Gallery page link copied',
              'Unable to copy to your clipboard',
            ))
          )
            linkCopied.trigger();
        }}
      >
        <CopyIcon copied={linkCopied.is()} icon={LinkIcon} />
        Copy Gallery Page Link
      </button>
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
  {:else if view === 'existing'}
    <div class={FOOTER}>
      <button
        type="button"
        class="btn preset-filled-primary-500"
        onclick={publishNew}
      >
        <SendIcon />
        Publish New Version
      </button>
    </div>
  {:else if view === 'form' || view === 'checking'}
    <div class={FOOTER}>
      {#if busy && step}
        <p class="w-full text-center text-sm" aria-hidden="true">
          {stepText}
        </p>
      {:else if view === 'form' && !fromAccount}
        <p class="w-full text-center text-sm">
          <span class="font-bold">It can’t be unpublished later.</span>
          {#if __ACCOUNTS_ENABLED__ && !account.summary}
            <a href={resolve('/account')} target="_blank" class="link"
              >Sign in</a
            > first if you might want to.
          {/if}
        </p>
      {/if}
      <button
        type="button"
        class="btn preset-filled-primary-500"
        disabled={!previews.active?.svg ||
          view === 'checking' ||
          busy ||
          shareNamesMissing}
        onclick={submit}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<SendIcon
          />{/if}
        {newVersion ? 'Publish New Version' : 'Publish'}
      </button>
    </div>
  {/if}
</StickyPart>
