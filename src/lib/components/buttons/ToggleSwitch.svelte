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
  interface Props {
    label?: string;
    checked?: boolean;
    disabled?: boolean;
    details?: string;
    detailsTextSize?: string;
    onchange?: (e: Event) => void;
  }

  let {
    label = '',
    checked = $bindable(false),
    disabled = false,
    details = '',
    detailsTextSize = 'text-sm',
    onchange,
  }: Props = $props();

  let hasDetails = $derived(details !== '');
  let uid = $props.id();
</script>

<label
  for="{uid}-checkbox"
  class={[
    'bg-surface-100 dark:bg-surface-900 rounded-container flex w-full justify-between gap-4 px-4 py-2 shadow-sm',
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
    <div
      class="bg-surface-300 dark:bg-surface-700 peer-disabled:bg-surface-500 dark:peer-disabled:bg-secondary-900 peer-focus:ring-tertiary-200 dark:peer-focus:ring-tertiary-600 peer peer-checked:after:border-surface-50-950 after:bg-surface-50 after:border-surface-300 dark:border-surface-600 peer-checked:bg-primary-900 dark:peer-checked:bg-primary-600 h-6 w-11 shrink-0 rounded-full peer-focus:ring-4 peer-focus:outline-hidden after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full"
    ></div>
  </div>
</label>
