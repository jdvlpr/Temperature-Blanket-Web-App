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

<!-- "Add N to your account", for projects and/or palettes (`kind`) in this
browser that belong to no account. Only while signed in and syncing; the dialog and the sync code load
when it's clicked, so guests never download them. -->

<script lang="ts">
  import { account } from '$lib/accounts/summary.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { PaletteStorage } from '$lib/storage/palettes.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import { sync } from '$lib/sync/status.svelte';
  import { CloudUploadIcon } from '@lucide/svelte';

  let {
    class: className = '',
    kind = 'all',
  }: { class?: string; kind?: 'projects' | 'palettes' | 'all' } = $props();

  let ids = $state<string[]>([]);
  let paletteIds = $state<string[]>([]);

  $effect(() => {
    // Look again after each sync pass, and when someone signs in or out
    void sync.version;
    if (!sync.active) {
      ids = [];
      paletteIds = [];
      return;
    }
    if (kind !== 'palettes')
      ProjectStorage.getIndex().then((index) => {
        ids = index.filter((item) => !item.sync).map((item) => item.id);
      });
    if (kind !== 'projects')
      PaletteStorage.guestIds().then((found) => (paletteIds = found));
  });

  async function open() {
    const userId = account.summary?.id;
    if (!userId) return;
    const { default: SyncImportDialog } =
      await import('./SyncImportDialog.svelte');
    dialog.trigger({
      type: 'component',
      component: {
        ref: SyncImportDialog,
        props: {
          userId,
          ids: [...ids],
          paletteIds: [...paletteIds],
          later: true,
        },
      },
      options: { showCloseButton: false },
    });
  }
</script>

{#if ids.length || paletteIds.length}
  <button
    type="button"
    class="btn preset-tonal-primary w-fit {className}"
    onclick={open}
  >
    <CloudUploadIcon />
    Add {[
      ids.length && `${ids.length} ${pluralize('project', ids.length)}`,
      paletteIds.length &&
        `${paletteIds.length} ${pluralize('palette', paletteIds.length)}`,
    ]
      .filter(Boolean)
      .join(' and ')} to your account
  </button>
{/if}
