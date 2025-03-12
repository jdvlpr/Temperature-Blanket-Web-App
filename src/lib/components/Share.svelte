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
      copiedMessage = `<span class="inline-flex items-center gap-1">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
			<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
			</svg>Copied to your clipboard</span>`;
    } catch {
      copiedMessage = 'Unable to share page.';
    }
  }

  $effect(() => {
    if (copiedMessage !== '') {
      toast.trigger({
        message: copiedMessage,
        background: 'preset-filled-success-100-900',
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
            class="btn preset-filled-secondary-500"
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
