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
  A thin bar of how much of the blanket is made, beside its words (which say
  the amount; the bar is for the eye).
-->
<script lang="ts">
  let { percent, class: className = '' }: { percent: number; class?: string } =
    $props();
</script>

<span
  class={[
    'bg-surface-200-800 block h-1.5 overflow-hidden rounded-full',
    className,
  ]}
  aria-hidden="true"
  data-testid="progress-bar"
>
  <span
    class="bg-primary-500 block h-full rounded-full transition-[width] duration-300"
    style:width="{Math.min(100, Math.max(0, percent))}%"
  ></span>
</span>
