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

<script>
  import { dialog } from '$lib/state';
  import { SendIcon } from '@lucide/svelte';
  import AddToGallery from '../modals/AddToGallery.svelte';

  let { isPrimary = false } = $props();
</script>

<button
  class={[
    'btn w-fit whitespace-pre-wrap',
    isPrimary
      ? 'bg-primary-50-950 border-primary-500 hover:preset-tonal-primary border'
      : 'hover:preset-tonal-surface',
  ]}
  onclick={() =>
    dialog.trigger({
      type: 'component',
      component: {
        ref: AddToGallery,
      },
    })}
  title="Show Send to Gallery Modal"
>
  <SendIcon />
  Send to Project Gallery
</button>
