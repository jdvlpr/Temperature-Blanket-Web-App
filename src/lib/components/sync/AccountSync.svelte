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

<!-- Keeps the signed-in account's projects in sync. Mounted once, in the root
layout, when accounts are on. The sync code loads only after someone signs in. -->

<script lang="ts">
  import { page } from '$app/state';
  import { getSession } from '#lib/accounts/client.js';
  import { isNewAccount } from '#lib/accounts/welcome.js';
  import {
    account,
    forgetAccountSummary,
    rememberAccountSummary,
  } from '#lib/accounts/summary.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import { isThumbnailFrame } from '#lib/storage/thumbnails.js';

  // My Projects' hidden frame only draws a project's picture: no syncing there
  const frame = isThumbnailFrame();

  let syncModule: typeof import('#lib/sync/sync.svelte.js') | undefined;
  let checkedSummary = false;

  // Summaries saved before sync have no account ID: ask the server once
  $effect(() => {
    if (frame) return;
    const summary = account.summary;
    if (!summary || summary.id || checkedSummary) return;
    checkedSummary = true;
    getSession()
      .then((session) => {
        if (session?.user) rememberAccountSummary(session.user);
        else forgetAccountSummary();
      })
      .catch(() => {
        // Offline: try again on the next page load
      });
  });

  $effect(() => {
    if (frame) return;
    const userId = account.summary?.id;
    if (!userId) {
      syncModule?.stopSync();
      return;
    }
    void (async () => {
      syncModule ??= await import('#lib/sync/sync.svelte.js');
      syncModule.startSync();
    })();
  });

  // Once per account and page load, and not on the sign-in page, which is
  // about to move on (and close any dialog as it does)
  let offeredTo: string | undefined;
  $effect(() => {
    if (frame) return;
    const userId = account.summary?.id;
    if (!userId) return void (offeredTo = undefined);
    if (offeredTo === userId) return;
    if (page.url.pathname.startsWith('/auth/')) return;
    offeredTo = userId;
    void offer(userId);
  });

  async function offer(userId: string) {
    syncModule ??= await import('#lib/sync/sync.svelte.js');
    // First sign-in on this device: offer to add its projects to the
    // account. A brand-new account is welcomed first, in the same dialog.
    const state = await ProjectStorage.accountSyncState(userId);
    const [ids, paletteIds] = state.importAsked
      ? [[], []]
      : [
          await syncModule.guestProjectIds(),
          await syncModule.guestPaletteIds(),
        ];
    const welcome = await isNewAccount(userId);
    if (!welcome && !ids.length && !paletteIds.length) return;
    if (dialog.opened || account.summary?.id !== userId) return;
    if (welcome) {
      const { default: WelcomeDialog } =
        await import('#lib/components/account/WelcomeDialog.svelte');
      dialog.trigger({
        type: 'component',
        component: {
          ref: WelcomeDialog,
          props: {
            userId,
            name: account.summary?.name ?? '',
            ids,
            paletteIds,
          },
        },
        options: { showCloseButton: false },
      });
      return;
    }
    const { default: SyncImportDialog } =
      await import('./SyncImportDialog.svelte');
    dialog.trigger({
      type: 'component',
      component: {
        ref: SyncImportDialog,
        props: { userId, ids, paletteIds },
      },
      options: { showCloseButton: false },
    });
  }
</script>
