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
  interface Props {
    label?: string;
    checked?: boolean;
    disabled?: boolean;
    details?: string;
    detailsTextSize?: string;
    onchange?: (e: Event) => void;
    /** Leaves off the card background and border, for use inside a card */
    bare?: boolean;
  }

  let {
    label = '',
    checked = $bindable(false),
    disabled = false,
    details = '',
    detailsTextSize = 'text-sm',
    onchange,
    bare = false,
  }: Props = $props();

  let hasDetails = $derived(details !== '');
  let uid = $props.id();
</script>

<label
  for="{uid}-checkbox"
  class={[
    'flex w-full justify-between gap-4 px-4',
    bare
      ? 'py-3'
      : 'bg-surface-100-900 rounded-container border-surface-200-800 border py-2',
    !disabled && 'cursor-pointer',
  ]}
>
  <div class="flex flex-col items-start">
    <span class={['flex items-center gap-2', hasDetails && 'font-bold']}
      >{@html label}</span
    >
    {#if hasDetails}
      <span class="{detailsTextSize} text-surface-700-300 text-left"
        >{@html details}</span
      >
    {/if}
  </div>
  <div class="relative inline-flex items-start gap-2">
    <input
      id="{uid}-checkbox"
      type="checkbox"
      bind:checked
      class="peer sr-only"
      {disabled}
      {onchange}
    />
    <!-- On, it's the theme's brand color, like a checked checkbox. Its corners
    follow the roundness preference; keyboard focus outlines it like a field. -->
    <div
      class="bg-surface-300-700 after:bg-surface-50 after:border-surface-300 peer-checked:after:border-surface-50 peer-focus-visible:outline-primary-500 rounded-base after:rounded-base h-6 w-11 shrink-0 peer-checked:bg-(--color-brand-light) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:opacity-50 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full in-data-[motion=reduce]:after:transition-none motion-reduce:after:transition-none dark:peer-checked:bg-(--color-brand-dark)"
    ></div>
  </div>
</label>
