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

<script lang="ts">
  import { ArrowRightIcon } from '@lucide/svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';

  interface Props {
    /** Runs if the search is cancelled or fails */
    onCancel?: () => void;
  }
  let { onCancel }: Props = $props();

  function setModal() {
    dialog.close();
    weatherSearch.start({ onCancel });
  }
</script>

<div class="flex flex-col p-2 text-center">
  <p class="text-lg font-bold">Are you sure?</p>

  <p class="my-4">This will overwrite your custom weather data.</p>

  <div class="mb-4">
    <button
      class="btn preset-filled-primary-500"
      onclick={() => {
        setModal();
      }}
      title="Search for Weather Data"
      id="location-action-button"
    >
      Reload Weather Data <ArrowRightIcon />
    </button>
  </div>
</div>
