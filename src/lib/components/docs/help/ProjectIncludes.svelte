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

<!-- Help text, shown in a help dialog and on its Guides & Help page: what each
way of opening a project brings with it, the open project's way marked -->
<script lang="ts">
  import { project } from '#lib/state/project-state.svelte.js';

  const WAYS = [
    {
      id: 'saved',
      name: 'Saved project',
      weather: 'Saved days',
      recent: 'Stay as saved',
    },
    {
      id: 'link',
      name: 'Link',
      // Or loads a gallery page's days, when its project has one (GalleryWeather)
      weather: "Press Search, or a gallery page's days",
      recent: 'Can differ a little',
    },
    {
      id: 'gallery',
      name: 'Gallery copy',
      weather: "Page's days",
      recent: 'As published',
    },
  ] as const;

  const current = $derived(
    project.status.loadedFrom === 'saved-custom'
      ? 'saved'
      : project.status.loadedFrom,
  );
</script>

{#snippet thisOne(id: string)}
  {#if id === current}<span class="sr-only"> (this project)</span>{/if}
{/snippet}

<div class="@container flex flex-col gap-2">
  <table
    class="hidden w-full text-left text-sm @sm:table [&_td]:p-2 [&_th]:p-2"
  >
    <thead>
      <tr>
        <td></td>
        <th scope="col">Weather</th>
        <th scope="col">Recent days</th>
      </tr>
    </thead>
    <tbody>
      {#each WAYS as way (way.id)}
        <tr class={[way.id === current && 'bg-surface-200-800']}>
          <th scope="row">{way.name}{@render thisOne(way.id)}</th>
          <td>{way.weather}</td>
          <td>{way.recent}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <!-- Narrow: one card per way -->
  <ul class="flex flex-col gap-2 text-left text-sm @sm:hidden">
    {#each WAYS as way (way.id)}
      <li
        class={[
          'rounded-container p-2',
          way.id === current && 'bg-surface-200-800',
        ]}
      >
        <p class="font-bold">{way.name}{@render thisOne(way.id)}</p>
        <p>Weather: {way.weather}</p>
        <p>Recent days: {way.recent}</p>
      </li>
    {/each}
  </ul>
  <p>Save the project to keep its days as they are.</p>
</div>
