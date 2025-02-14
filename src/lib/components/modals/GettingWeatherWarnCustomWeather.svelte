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
  import GettingWeather from '$lib/components/modals/GettingWeather.svelte';
  import { modal } from '$lib/state';
  import ModalShell from './ModalShell.svelte';

  interface Props {
    parent: any;
  }

  function setModal() {
    modal.trigger({
      type: 'component',
      component: { ref: GettingWeather },
    });
  }
</script>

<ModalShell>
  <div class="flex flex-col text-center">
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
        Reload Weather Data <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
          />
        </svg>
      </button>
    </div>
  </div>
</ModalShell>
