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
  import { browser } from '$app/env';
  import { page } from '$app/state';
  import { getSession } from '#lib/accounts/client.js';
  import { getRavelryStatus } from '#lib/accounts/ravelry.js';
  import { isNewAccount } from '#lib/accounts/welcome.js';
  import {
    account,
    forgetAccountSummary,
    rememberAccountSummary,
  } from '#lib/accounts/summary.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
  import { onMount } from 'svelte';

  // My Projects' hidden frame only draws a project's picture: no syncing there
  const frame = isThumbnailFrame();

  let syncModule: typeof import('#lib/sync/sync.svelte.js') | undefined;

  // Back from connecting Ravelry in the welcome (see $lib/accounts/ravelry),
  // anywhere but the Account page, whose Ravelry row tells it. Read before
  // the page mounts, as pages may rewrite their address then.
  const ravelryReturn = (() => {
    if (!browser || frame) return null;
    const params = new URL(window.location.href).searchParams;
    const result = params.get('ravelry');
    if (!result || window.location.pathname === '/account') return null;
    return { failed: result === 'failed', error: params.get('error') };
  })();

  onMount(async () => {
    if (!ravelryReturn) return;
    const url = new URL(window.location.href);
    for (const key of ['ravelry', 'error', 'error_description'])
      url.searchParams.delete(key);
    history.replaceState(history.state, '', url);
    if (ravelryReturn.failed) {
      const canceled = ravelryReturn.error === 'access_denied';
      toast.trigger({
        message: canceled
          ? 'Connecting Ravelry was canceled.'
          : 'Ravelry couldn’t be connected. Try again from your Account page.',
        category: canceled ? 'info' : 'error',
      });
      return;
    }
    const status = await getRavelryStatus();
    toast.trigger({
      message:
        status?.available && status.connected && status.username
          ? `Ravelry connected as ${status.username}`
          : 'Ravelry connected',
      category: 'success',
    });
  });

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
      const [{ default: WelcomeDialog }, ravelry] = await Promise.all([
        import('#lib/components/account/WelcomeDialog.svelte'),
        getRavelryStatus(),
      ]);
      if (dialog.opened || account.summary?.id !== userId) return;
      dialog.trigger({
        type: 'component',
        component: {
          ref: WelcomeDialog,
          props: {
            userId,
            name: account.summary?.name ?? '',
            ids,
            paletteIds,
            ravelry: ravelry?.available === true && !ravelry.connected,
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
