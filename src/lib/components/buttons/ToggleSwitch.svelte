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
  class={["flex justify-between gap-4 w-full bg-surface-100 dark:bg-surface-900 py-2 px-4 rounded-container shadow-sm", !disabled && 'cursor-pointer']}
>
    <div class="flex flex-col items-start">
      <span class={["flex gap-2 items-center", hasDetails && 'font-bold']}>{@html label}</span>
      {#if hasDetails}
        <span class="{detailsTextSize} text-left">{@html details}</span>
      {/if}
    </div>
  <div class="relative inline-flex items-start gap-2">
    <input
      id="{uid}-checkbox"
      type="checkbox"
      bind:checked
      class="sr-only peer"
      {disabled}
      {onchange}
    />
    <div
      class="shrink-0 w-11 h-6 bg-surface-300 dark:bg-surface-700 peer-disabled:bg-surface-500 dark:peer-disabled:bg-secondary-900 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-tertiary-200 dark:peer-focus:ring-tertiary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-50-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-50 after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-900 dark:peer-checked:bg-primary-600"
    ></div>
  </div>
</label>
