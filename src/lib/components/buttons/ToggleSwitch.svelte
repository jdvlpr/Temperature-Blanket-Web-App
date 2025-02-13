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
    onchange?: (e: Event) => void;
    maxWidth?: string;
  }

  let {
    label = '',
    checked = $bindable(false),
    disabled = false,
    details = '',
    onchange,
    maxWidth = '450px',
  }: Props = $props();

  let hasDetails = details !== '';
</script>

<label class="relative inline-flex items-start cursor-pointer gap-2">
  <input
    type="checkbox"
    bind:checked
    class="sr-only peer"
    {disabled}
    {onchange}
  />
  <div
    class="flex-shrink-0 w-11 h-6 bg-surface-300-700 peer-disabled:bg-surface-500 dark:peer-disabled:bg-secondary-900 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tertiary-200 dark:peer-focus:ring-tertiary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-50-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-50 after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-900 dark:peer-checked:bg-primary-600"
  ></div>
  <span class:font-bold={hasDetails}>{@html label}</span>
</label>
{#if hasDetails}
  <span class="max-w-[{maxWidth}] text-xs">{details}</span>
{/if}
