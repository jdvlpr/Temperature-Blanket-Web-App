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

  let copiedMessage = $state('');

  let openState = $state(false);

  function copyURL() {
    try {
      window.navigator.clipboard.writeText(href);
      copiedMessage = `Copied to your clipboard`;
    } catch {
      copiedMessage = 'Unable to share page.';
    }
  }

  $effect(() => {
    if (copiedMessage !== '') {
      toast.trigger({
        message: copiedMessage,
        category:
          copiedMessage === 'Copied to your clipboard' ? 'success' : null,
      });
      copiedMessage = '';
    }
  });
</script>

<div class="w-fit text-left">
  <Popover
    open={openState}
    onOpenChange={(e) => {
      openState = e.open;
    }}
    triggerBase="btn-icon hover:preset-tonal"
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
          class="select-all break-all card bg-primary-50 dark:bg-primary-950 p-4 basis-full"
        >
          {href}
        </p>
        <div class="inline-flex flex-wrap gap-4 items-center">
          <button
            class="btn preset-filled-primary-500"
            onclick={() => copyURL()}
          >
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
</div>
