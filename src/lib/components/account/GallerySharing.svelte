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
  A saved project's or palette's place in the gallery, on its row in My
  Projects. Not published: Publish to Gallery. Published: a menu of its
  version's options, as in the Gallery dialog's list: View Gallery Page,
  Anonymous, and Unpublish (it asks first, under the row). With several
  versions (gallery pages), each is listed, newest first, by the page's own
  name, when it was published, and whose name it shows, and opens those
  options for itself. Then Publish New Version once a
  project has changed, or for a palette (whose colors never change) Update
  Gallery Name once its name differs from its page's, renaming the page in
  place. A gallery page is a snapshot from when it was published. Its link is
  a copy, always shareable, so it isn't a setting here: Copy Link comes in as
  `children`, first on the row. On a card (`compact`) it's one button either
  way: Published ▾ (the menu above), or Unpublished ▾, whose menu has Publish
  to Gallery.
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { anonymousDetail } from '#lib/accounts/anonymous.js';
  import { aboutVersion, publishedOn } from '#lib/accounts/gallery-version.js';
  import { DISPLAY_NAME_HREF } from '#lib/accounts/display-name-link.js';
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import MenuCheckbox from '#lib/components/buttons/MenuCheckbox.svelte';
  import MenuSubmenu from '#lib/components/buttons/MenuSubmenu.svelte';
  import {
    drillPositionerClass,
    provideMenuDrill,
  } from '#lib/components/menu-drill.svelte.js';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';
  import {
    ChevronDownIcon,
    EyeOffIcon,
    ExternalLinkIcon,
    GlobeIcon,
    GlobeOffIcon,
    LoaderCircleIcon,
    PencilIcon,
    SendIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  let {
    kind,
    label,
    page,
    changedSince = false,
    onadd,
    onupdate,
    children,
    compact = false,
    galleryOnly = false,
  }: {
    kind: 'project' | 'palette';
    /** The project's or palette's name, for screen readers */
    label: string;
    /** Its gallery page (the newest), if it has one */
    page?: GalleryPage;
    /** Whether it changed after its newest gallery page was made (a palette: its name differs) */
    changedSince?: boolean;
    /** Publishes it (the dialog asks about the account's name) */
    onadd: () => void;
    /** A project: publishes a new version after this page (the dialog asks which
     * to unpublish). A palette: renames this page */
    onupdate: (page: GalleryPage) => void;
    /** First on the row, e.g. Copy Link */
    children?: Snippet;
    /** On a card: one Published ▾ or Unpublished ▾ button (see above) */
    compact?: boolean;
    /** Not saved here (deleted, or never saved in this browser): unpublishing
    its last version leaves no copy in the account */
    galleryOnly?: boolean;
  } = $props();

  const drill = provideMenuDrill();

  // The version being unpublished, asking first
  let confirming = $state<number | null>(null);
  let busy = $state(false);
  let errorMessage = $state('');

  let ownerName = $derived(
    (galleryPages.name ?? account.summary?.name ?? '').trim(),
  );

  // All its versions, newest first
  let versions = $derived(page ? galleryPages.pagesLike(page) : []);

  // Publishing (and new versions) needs publishing on; the rest works either way
  let canAdd = $derived(galleryPages.publishing);

  const colorsOf = (link?: string | null) =>
    (link && getColorsFromInput({ string: link })) || null;

  const hrefFor = (p: GalleryPage) =>
    p.kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(p.postId) })
      : resolve('/gallery/[id]', { id: String(p.postId) });

  function publish() {
    errorMessage = '';
    if (!canAdd) {
      errorMessage =
        'Publishing to the gallery is paused right now. Try again later.';
      return;
    }
    onadd();
  }

  // For this version only
  async function setNamed(postId: number, next: boolean) {
    errorMessage = '';
    busy = true;
    try {
      await galleryPages.setShowOwner(postId, next);
    } catch {
      errorMessage = 'That change couldn’t be saved. Try again later.';
    } finally {
      busy = false;
    }
  }

  // Choosing an item, by pointer or keyboard, sends it this event (also in a submenu)
  const onChoose = (handler: () => void) => (el: HTMLElement) => {
    el.addEventListener('menu:select', handler);
    return () => el.removeEventListener('menu:select', handler);
  };

  let confirmingPage = $derived(
    versions.find((p) => p.postId === confirming) ?? null,
  );

  async function remove() {
    if (confirming === null) return;
    busy = true;
    errorMessage = '';
    try {
      await galleryPages.remove(confirming);
      confirming = null;
    } catch {
      errorMessage = 'It couldn’t be unpublished. Try again later.';
    } finally {
      busy = false;
    }
  }

  // First on the row, it lines up with the text above
  let triggerClass = $derived(
    `btn btn-sm hover:preset-tonal-surface${children ? '' : ' -ml-2'}`,
  );
</script>

<!-- With publishing paused, one without a page has only Copy Link (on a card,
Unpublished says it's paused) -->
{#if page || compact || canAdd || children}
  <div
    class={['flex flex-col gap-1 text-sm', !compact && 'mt-2']}
    aria-label="Gallery: {label}"
    role="group"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      {@render children?.()}
      {#if !page && canAdd && !compact}
        <button
          type="button"
          class={triggerClass}
          onclick={publish}
          aria-label="Publish to Gallery: {label}"
          ><SendIcon aria-hidden="true" />Publish to Gallery</button
        >
      {:else if page || compact}
        <Menu
          positioning={menuPositioning('bottom-start')}
          onOpenChange={({ open }) => {
            if (!open) drill.reset();
          }}
        >
          <Menu.Trigger class={triggerClass}>
            {#if page}
              <GlobeIcon aria-hidden="true" />
            {:else}
              <GlobeOffIcon aria-hidden="true" />
            {/if}
            <span
              ><span class="sr-only">Gallery: </span>{page
                ? versions.length > 1
                  ? `Published · ${versions.length} versions`
                  : 'Published'
                : 'Unpublished'}</span
            >
            <ChevronDownIcon class="icon-sm" aria-hidden="true" />
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner class={drillPositionerClass}>
              <Menu.Content class="{menuContentClass} pointer-events-auto">
                {#if !page}
                  {#if canAdd}
                    <Menu.Item value="publish" class={menuItemClass}>
                      {#snippet element(attributes)}
                        <div {...attributes} {@attach onChoose(publish)}>
                          <SendIcon class="shrink-0" aria-hidden="true" />
                          <span class="min-w-0 flex-1">Publish to Gallery…</span
                          >
                        </div>
                      {/snippet}
                    </Menu.Item>
                  {:else}
                    <p class="text-surface-700-300 max-w-72 px-2 py-1 text-xs">
                      Publishing to the gallery is paused right now.
                    </p>
                  {/if}
                {:else}
                  <!-- One version's options: in its submenu, or with only one, right here -->
                  {#snippet versionItems(p: GalleryPage)}
                    <Menu.Item value="view-{p.postId}" class={menuItemClass}>
                      {#snippet element(attributes)}
                        <!-- eslint-disable svelte/no-navigation-without-resolve -- resolved above -->
                        <a
                          {...attributes as HTMLAnchorAttributes}
                          href={hrefFor(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLinkIcon
                            class="shrink-0"
                            aria-hidden="true"
                          />
                          <span class="min-w-0 flex-1"
                            >View Gallery Page<span class="sr-only">
                              (opens in a new tab)</span
                            ></span
                          >
                        </a>
                        <!-- eslint-enable svelte/no-navigation-without-resolve -->
                      {/snippet}
                    </Menu.Item>
                    <!-- Stays open, so the check shows it took -->
                    <Menu.OptionItem
                      type="checkbox"
                      value="anonymous-{p.postId}"
                      checked={!p.showOwner}
                      closeOnSelect={false}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        void setNamed(p.postId, !checked)}
                      class={menuItemClass}
                    >
                      <span class="flex min-w-0 flex-1 flex-col">
                        <span>Anonymous</span>
                        <span class="text-surface-700-300 text-xs"
                          >{anonymousDetail(!p.showOwner, ownerName)}</span
                        >
                      </span>
                      <MenuCheckbox checked={!p.showOwner} />
                    </Menu.OptionItem>
                    <Menu.Item
                      value="unpublish-{p.postId}"
                      class={menuItemClass}
                    >
                      {#snippet element(attributes)}
                        <div
                          {...attributes}
                          {@attach onChoose(() => (confirming = p.postId))}
                        >
                          <EyeOffIcon class="shrink-0" aria-hidden="true" />
                          <span class="min-w-0 flex-1">Unpublish…</span>
                        </div>
                      {/snippet}
                    </Menu.Item>
                  {/snippet}
                  {#if versions.length === 1}
                    {@render versionItems(versions[0])}
                  {:else}
                    {#each versions as p (p.postId)}
                      {@const colors = colorsOf(p.link)}
                      <MenuSubmenu
                        label={p.title}
                        current={aboutVersion(p, ownerName)}
                        icon={GlobeIcon}
                      >
                        {#snippet below()}
                          {#if colors}
                            <span class="mt-1 block w-40">
                              <PaletteStrip
                                {colors}
                                height="12px"
                                insideControl
                              />
                            </span>
                          {/if}
                        {/snippet}
                        {@render versionItems(p)}
                      </MenuSubmenu>
                    {/each}
                  {/if}
                {/if}
                {#if changedSince && canAdd && drill.showsMenu}
                  <Menu.Separator />
                  <Menu.Item value="update" class={menuItemClass}>
                    {#snippet element(attributes)}
                      <div
                        {...attributes}
                        {@attach onChoose(() => page && onupdate(page))}
                      >
                        {#if kind === 'palette'}
                          <PencilIcon class="shrink-0" aria-hidden="true" />
                          <span class="flex min-w-0 flex-1 flex-col">
                            <span>Update Gallery Name…</span>
                            <span class="text-surface-700-300 text-xs"
                              >To “{label}”. Its link stays the same.</span
                            >
                          </span>
                        {:else}
                          <SendIcon class="shrink-0" aria-hidden="true" />
                          <span class="flex min-w-0 flex-1 flex-col">
                            <span>Publish New Version…</span>
                            <span class="text-surface-700-300 text-xs"
                              >As it is now. You choose which versions to
                              unpublish.</span
                            >
                          </span>
                        {/if}
                      </div>
                    {/snippet}
                  </Menu.Item>
                {/if}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu>
      {/if}
      {#if busy && confirming === null}
        <LoaderCircleIcon class="icon-sm animate-spin" aria-label="Saving" />
      {/if}
    </div>

    {#if page && changedSince && canAdd && confirming === null && !compact}
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        {#if kind === 'palette'}
          <span class="opacity-70"
            >Its gallery page is named “{page.title}”.</span
          >
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface"
            onclick={() => page && onupdate(page)}
            disabled={busy}
            aria-label="Update Gallery Name: {label}"
            ><PencilIcon class="icon-sm" />Update Gallery Name</button
          >
        {:else}
          <span class="opacity-70"
            >Changed since it was published on {publishedOn(
              page.publishedAt,
            )}.</span
          >
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface"
            onclick={() => page && onupdate(page)}
            disabled={busy}
            aria-label="Publish a new version of {label}"
            ><SendIcon class="icon-sm" />Publish New Version</button
          >
        {/if}
      </div>
    {/if}

    {#if versions.some((p) => p.showOwner) && !ownerName}
      <p class="text-warning-700-300">
        Add a display name in your
        <a href={DISPLAY_NAME_HREF} class="link">Profile settings</a>
        to show it.
      </p>
    {/if}

    {#if confirmingPage}
      <div class="flex flex-col gap-2 py-1" in:safeSlide>
        <p>
          Unpublish the version published {publishedOn(
            confirmingPage.publishedAt,
          )}? Its gallery page link stops working{kind === 'project'
            ? ', and it comes off the globe'
            : ''}.
          {#if galleryOnly}
            {versions.length > 1
              ? `Its other versions stay published.`
              : `It isn’t in your saved ${kind}s, so it won’t be on My Projects anymore; to keep it, choose Add to My Saved ${kind === 'project' ? 'Projects' : 'Palettes'} first.`}
            Links you’ve shared to the {kind} still work.
          {:else}
            Your {kind} stays saved, and links you’ve shared to the {kind} still work.
          {/if}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm preset-filled-error-500 max-sm:w-full"
            onclick={remove}
            disabled={busy}
          >
            {#if busy}
              <LoaderCircleIcon class="animate-spin" />
            {/if}
            Unpublish
          </button>
          <button
            type="button"
            class="btn btn-sm preset-tonal-surface max-sm:w-full"
            onclick={() => (confirming = null)}
            disabled={busy}>Cancel</button
          >
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <p class="text-error-700-300" role="alert">{errorMessage}</p>
    {/if}
  </div>
{/if}
