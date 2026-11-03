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
  A weather grid's day, the same in every table: made or not (the project's
  progress; a button opening Progress where `onmade` is given), the date (a
  label for the row's checkbox with `labelFor`), may still change, kept saved
  values (a button opening KeptDay with `onkept`), and the location under it
  when there are several.
-->
<script lang="ts">
  import RecentWeatherDataTooltip from '#lib/components/RecentWeatherDataTooltip.svelte';
  import { CircleCheckIcon, CircleIcon, HistoryIcon } from '@lucide/svelte';

  let {
    date,
    location = '',
    made = null,
    onmade,
    kept = false,
    onkept,
    recent = false,
    labelFor,
  }: {
    date: string;
    /** Its location's name, when there are several */
    location?: string;
    /** Made or not (null: progress doesn't cover it, as with no progress set) */
    made?: boolean | null;
    onmade?: () => void;
    kept?: boolean;
    onkept?: () => void;
    recent?: boolean;
    labelFor?: string;
  } = $props();
</script>

<div class="flex min-w-0 flex-col justify-center leading-tight">
  <span class="flex min-w-0 items-center gap-0.5">
    {#if made !== null}
      {#if onmade}
        <button
          type="button"
          class={[
            'btn-icon btn-icon-sm hover:preset-tonal-surface -ml-1 shrink-0',
            made ? 'text-success-700-300' : 'opacity-35',
          ]}
          title={made
            ? 'Made: set how far you’ve made it'
            : 'Not made yet: set how far you’ve made it'}
          aria-label="{date}: {made ? 'made' : 'not made yet'}. Set progress"
          onclick={onmade}
          data-testid="table-made"
          data-made={made}
        >
          {#if made}
            <CircleCheckIcon class="icon-sm" />
          {:else}
            <CircleIcon class="icon-sm" />
          {/if}
        </button>
      {:else if made}
        <CircleCheckIcon
          class="icon-sm text-success-700-300 mr-1 shrink-0"
          aria-label="made"
        />
      {/if}
    {/if}
    {#if labelFor}
      <label
        for={labelFor}
        class="cursor-pointer text-sm whitespace-nowrap tabular-nums"
        >{date}</label
      >
    {:else}
      <span class="text-sm whitespace-nowrap tabular-nums">{date}</span>
    {/if}
    {#if recent}
      <RecentWeatherDataTooltip />
    {/if}
    {#if kept}
      {#if onkept}
        <button
          type="button"
          class="btn-icon btn-icon-sm hover:preset-tonal-surface shrink-0"
          title="Kept saved values"
          aria-label="{date}: kept saved values. Show the new ones"
          onclick={onkept}
        >
          <HistoryIcon class="icon-sm" />
        </button>
      {:else}
        <HistoryIcon
          class="icon-sm ml-1 shrink-0 opacity-70"
          aria-label="Kept before"
        />
      {/if}
    {/if}
  </span>
  {#if location}
    <span class="truncate text-xs opacity-70" title={location}>{location}</span>
  {/if}
</div>
