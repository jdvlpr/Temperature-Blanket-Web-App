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

<script>
  import { PUBLIC_KOFI_LINK } from '$env/static/public';
  import DonateOptionsModal from '$lib/components/modals/DonateOptionsModal.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { HeartIcon } from '@lucide/svelte';

  function openDonationOptions() {
    dialog.trigger({
      type: 'component',
      component: {
        ref: DonateOptionsModal,
      },
      options: {
        showCloseButton: true,
        size: 'small',
      },
    });
  }
</script>

{#if PUBLIC_KOFI_LINK}
  <button
    type="button"
    onclick={openDonationOptions}
    class="btn hover:preset-tonal-surface inline-flex h-auto items-center justify-center gap-1"
  >
    <HeartIcon fill="#EE6E6C" color="#EE6E6C" />
    <span class="text-left whitespace-pre-wrap">Donate Now</span>
  </button>
{/if}
