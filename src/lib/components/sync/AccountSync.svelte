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
  import { getSession } from '$lib/accounts/client';
  import {
    account,
    forgetAccountSummary,
    rememberAccountSummary,
  } from '$lib/accounts/summary.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';

  let syncModule: typeof import('$lib/sync/sync.svelte') | undefined;
  let checkedSummary = false;

  // Summaries saved before sync have no account ID: ask the server once
  $effect(() => {
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
    const userId = account.summary?.id;
    if (!userId) {
      syncModule?.stopSync();
      return;
    }
    void (async () => {
      syncModule ??= await import('$lib/sync/sync.svelte');
      syncModule.startSync();

      // First sign-in on this device: offer to add its projects to the account
      const state = await ProjectStorage.accountSyncState(userId);
      if (state.importAsked) return;
      const ids = await syncModule.guestProjectIds();
      if (!ids.length) return;
      if (dialog.opened) return;
      const { default: SyncImportDialog } =
        await import('./SyncImportDialog.svelte');
      dialog.trigger({
        type: 'component',
        component: { ref: SyncImportDialog, props: { userId, ids } },
        options: { showCloseButton: false },
      });
    })();
  });
</script>
