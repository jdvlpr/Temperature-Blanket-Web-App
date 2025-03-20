<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script lang="ts">
  import { toast } from '$lib/state';
  import { ClipboardCopyIcon, Share2Icon, XIcon } from '@lucide/svelte';
  import { Popover } from '@skeletonlabs/skeleton-svelte';

  let { href } = $props();

  let openState = $state(false);

  function copyURL() {
    try {
      window.navigator.clipboard.writeText(href);
      toast.trigger({
        message: 'Copied',
        category: 'success',
      });
    } catch {
      toast.trigger({
        message: 'Unable to copy to your clipboard',
        category: 'error',
      });
    }
  }
</script>

<Popover
  open={openState}
  onOpenChange={(e) => {
    openState = e.open;
  }}
  base="btn-icon hover:preset-tonal"
  triggerBase=""
  contentBase="card bg-surface-200 dark:bg-surface-800 p-4 space-y-4 max-w-[90vw]"
  arrow
  arrowBackground="bg-surface-200! dark:bg-surface-800!"
  zIndex="100"
>
  {#snippet trigger()}
    <Share2Icon />
  {/snippet}
  {#snippet content()}
    <div class="flex flex-col gap-2">
      <p class="text-sm">Shareable Page URL</p>
      <p
        class="card bg-primary-50 dark:bg-primary-950 basis-full p-4 break-all select-all"
      >
        {href}
      </p>
      <div class="inline-flex flex-wrap items-center gap-4">
        <button class="btn preset-filled-primary-500" onclick={() => copyURL()}>
          <ClipboardCopyIcon />
          Copy URL</button
        >

        <button
          class="btn preset-filled-surface-50-950"
          onclick={() => {
            openState = false;
          }}
        >
          <XIcon />
          Close
        </button>
      </div>
    </div>
  {/snippet}
</Popover>
