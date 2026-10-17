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

<!-- Once, right after an account is made: a display name to keep or change
(a made-up one to start, see $lib/accounts/craft-names), what the account does,
then the projects and palettes in this browser to add, if there are any, then
connecting Ravelry, where it's set up. That goes last: it leaves the site. -->

<script lang="ts">
  import { accountErrorMessage, updateName } from '#lib/accounts/client.js';
  import { connectRavelry } from '#lib/accounts/ravelry.js';
  import {
    account,
    rememberAccountSummary,
  } from '#lib/accounts/summary.svelte.js';
  import SyncImportDialog from '#lib/components/sync/SyncImportDialog.svelte';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
  } from '#lib/constants/class-constants.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import {
    CloudIcon,
    GalleryVerticalEndIcon,
    LibraryIcon,
    LinkIcon,
    LoaderCircleIcon,
  } from '@lucide/svelte';
  import { tick, untrack } from 'svelte';

  let {
    userId,
    name: givenName,
    ids = [],
    paletteIds = [],
    ravelry = false,
  }: {
    userId: string;
    /** The name the account was made with */
    name: string;
    /** Projects and palettes in this browser to offer next */
    ids?: string[];
    paletteIds?: string[];
    /** Whether Ravelry can be connected here */
    ravelry?: boolean;
  } = $props();

  let name = $state(untrack(() => givenName));
  let busy = $state(false);
  let errorMessage = $state('');
  let step = $state<'welcome' | 'import' | 'ravelry'>('welcome');
  let ravelryTitle = $state<HTMLElement>();
  // The import's adding, which Connect waits for before leaving the site
  let adding: Promise<void> = Promise.resolve();

  let hasImport = $derived(ids.length + paletteIds.length > 0);
  let steps = $derived([
    'welcome',
    ...(hasImport ? ['import'] : []),
    ...(ravelry ? ['ravelry'] : []),
  ]);
  let isLast = $derived(steps.length === 1);
  const stepLabel = (of: (typeof steps)[number]) =>
    `Step ${steps.indexOf(of) + 1} of ${steps.length}`;

  async function showRavelry() {
    step = 'ravelry';
    await tick();
    ravelryTitle?.focus();
  }

  async function connect() {
    busy = true;
    errorMessage = '';
    try {
      await adding;
      const { pathname, search, hash } = window.location;
      await connectRavelry(pathname + search + hash, { markSuccess: true });
    } catch {
      errorMessage = 'Ravelry couldn’t be connected. Try again.';
      busy = false;
    }
  }

  async function next(event: Event) {
    event.preventDefault();
    errorMessage = '';
    const trimmed = name.trim();
    if (trimmed !== givenName) {
      busy = true;
      try {
        await updateName(trimmed);
        if (account.summary)
          rememberAccountSummary({ ...account.summary, name: trimmed });
      } catch (e) {
        errorMessage = accountErrorMessage(e);
        busy = false;
        return;
      }
      busy = false;
    }
    if (hasImport) step = 'import';
    else if (ravelry) await showRavelry();
    else dialog.close();
  }
</script>

{#if step === 'import'}
  <SyncImportDialog
    {userId}
    {ids}
    {paletteIds}
    step={stepLabel('import')}
    onanswered={ravelry
      ? (given) => {
          adding = given;
          void showRavelry();
        }
      : undefined}
  />
{:else if step === 'ravelry'}
  <div role="dialog" aria-modal="true" aria-labelledby="welcome-ravelry-title">
    <div class="flex flex-col gap-4 px-4 pt-4">
      <div class="flex flex-col gap-1">
        <p class="text-sm opacity-70">{stepLabel('ravelry')}</p>
        <h2
          id="welcome-ravelry-title"
          class="h4"
          tabindex="-1"
          bind:this={ravelryTitle}
        >
          Connect Ravelry?
        </h2>
      </div>

      <p class="flex items-start gap-3">
        <LinkIcon class="icon-sm mt-0.5 shrink-0 opacity-70" />
        Post projects to Ravelry and add photos
      </p>
      {#if errorMessage}
        <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
      {/if}

      <DialogFooter>
        <button
          type="button"
          class={BTN_SECONDARY}
          disabled={busy}
          onclick={() => dialog.close()}>Not now</button
        >
        <button
          type="button"
          class={BTN_PRIMARY}
          disabled={busy}
          onclick={connect}
        >
          {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          Connect Ravelry
        </button>
      </DialogFooter>
    </div>
  </div>
{:else}
  <div role="dialog" aria-modal="true" aria-labelledby="welcome-title">
    <form class="flex flex-col gap-4 px-4 pt-4" onsubmit={next}>
      <div class="flex flex-col gap-1">
        {#if !isLast}<p class="text-sm opacity-70">
            {stepLabel('welcome')}
          </p>{/if}
        <h2 id="welcome-title" class="h4">Welcome!</h2>
      </div>

      <div class="flex flex-col gap-2">
        <label class="label" for="welcome-name">
          <span class="label-text font-bold">Your display name</span>
        </label>
        <input
          id="welcome-name"
          type="text"
          class="input"
          maxlength="80"
          autocomplete="nickname"
          enterkeyhint={isLast ? 'done' : 'next'}
          placeholder="Add a name"
          aria-describedby="welcome-name-help"
          bind:value={name}
          disabled={busy}
        />
        <p class="opacity-80">
          To start, set your display name, which is shown on gallery pages you
          choose to publish. You can change your display name anytime on your
          Account page.
        </p>
        {#if errorMessage}
          <p class="text-error-700-300 text-sm" role="alert">{errorMessage}</p>
        {/if}
      </div>

      <ul class="flex flex-col gap-2">
        <li class="flex items-start gap-3">
          <CloudIcon class="icon-sm mt-0.5 shrink-0 opacity-70" />
          Projects, yarn palettes and preferences you save now show up on every device
          you sign in on.
        </li>
        <li class="flex items-start gap-3">
          <LibraryIcon class="icon-sm mt-0.5 shrink-0 opacity-70" />
          Find them all in My Library. Anything you delete waits in the Trash for
          30 days.
        </li>
        <li class="flex items-start gap-3">
          <GalleryVerticalEndIcon class="icon-sm mt-0.5 shrink-0 opacity-70" />
          Share a project or palette from its menu, and publish it to the gallery
          if you like.
        </li>
      </ul>

      <DialogFooter>
        <button type="submit" class={BTN_PRIMARY} disabled={busy}>
          {#if busy}<LoaderCircleIcon class="animate-spin" />{/if}
          {isLast ? 'Done' : 'Continue'}
        </button>
      </DialogFooter>
    </form>
  </div>
{/if}
