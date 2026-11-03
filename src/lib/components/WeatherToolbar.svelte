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

<!-- @component
  The Weather step's toolbar: what the weather shows (its source, units and
  grouping, each with its value, so they're one tap away), then what to do
  with it (Edit: Edit Weather Data, which also imports a CSV file;
  Download). The Project menu's
  Weather Data group has the same.
-->
<script lang="ts">
  import StepToolbar from '#lib/components/StepToolbar.svelte';
  import WeatherGrouping from '#lib/components/WeatherGrouping.svelte';
  import DownloadExportButton from '#lib/components/buttons/DownloadExportButton.svelte';
  import UnitMenu from '#lib/components/buttons/UnitMenu.svelte';
  import WeatherSourceButton from '#lib/components/buttons/WeatherSourceButton.svelte';
  import { menuTriggerClass } from '#lib/components/menu-styles.js';
  import { openEditWeather } from '#lib/utils/open-edit-weather.js';
  import { SquarePenIcon } from '@lucide/svelte';
</script>

<StepToolbar label="Weather Data">
  {#snippet settings()}
    <WeatherSourceButton />
    <UnitMenu />
    <WeatherGrouping />
  {/snippet}

  {#snippet actions()}
    <!-- Edit Weather Data, which also imports a CSV file (Import File) -->
    <button
      type="button"
      class={menuTriggerClass}
      title="Edit Weather Data: change values, fill in missing days, or import a CSV file"
      onclick={() => openEditWeather()}
    >
      <SquarePenIcon aria-hidden="true" />
      <span>Edit</span>
    </button>

    <DownloadExportButton
      buttonText="Download"
      menuList={['pdf', 'csv', 'google-sheet']}
      placement="bottom-end"
    />
  {/snippet}
</StepToolbar>
