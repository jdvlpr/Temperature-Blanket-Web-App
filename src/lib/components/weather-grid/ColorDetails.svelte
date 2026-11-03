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
  A gauge color's details: its swatch and name (else "Color 3"), its brand and
  yarn, and "Color 3 of 8". In a swatch's popover, and in Edit Weather Data's
  value bar (`inline`, one line).
-->
<script lang="ts">
  import type { ColorInfo } from '#lib/utils/color-utils.js';

  let {
    color,
    inline = false,
  }: { color: ColorInfo | 'outside' | null; inline?: boolean } = $props();

  const info = $derived(color && color !== 'outside' ? color : null);
  const place = $derived(
    info && typeof info.index === 'number'
      ? `Color ${info.index + 1}${info.gaugeLength ? ` of ${info.gaugeLength}` : ''}`
      : '',
  );
  const yarn = $derived(
    [info?.brandName, info?.yarnName].filter(Boolean).join(' '),
  );
</script>

{#if inline}
  <span class="inline-flex min-w-0 items-center gap-1.5 text-sm">
    {#if info}
      <span
        class="size-3 shrink-0 rounded-full ring-1 ring-black/25"
        style:background-color={info.hex}
        aria-hidden="true"
      ></span>
      <span class="truncate">
        {[place, info.name, yarn].filter(Boolean).join(' · ')}
      </span>
    {:else if color === 'outside'}
      <span
        class="border-surface-500 size-3 shrink-0 rounded-full border border-dashed"
        aria-hidden="true"
      ></span>
      <span class="truncate">No color: in none of the gauge's ranges</span>
    {/if}
  </span>
{:else if info}
  <div class="flex items-start gap-2">
    <span
      class="mt-0.5 size-6 shrink-0 rounded-full ring-1 ring-black/25"
      style:background-color={info.hex}
      aria-hidden="true"
    ></span>
    <div class="flex min-w-0 flex-col leading-snug">
      <span class="font-bold">{info.name || place}</span>
      {#if yarn}<span>{yarn}</span>{/if}
      {#if info.name}<span class="text-xs opacity-70">{place}</span>{/if}
    </div>
  </div>
{/if}
