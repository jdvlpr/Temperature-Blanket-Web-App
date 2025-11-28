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
  import { ChevronDownIcon } from '@lucide/svelte';

  interface Props {
    isExpanded?: boolean;
    /** text to show regardless of whether expanded or collapsed. */
    label?: string;
    iconLess?: any;
    iconMore?: any;
    disabled?: boolean;
  }

  let {
    isExpanded = $bindable(false),
    label = '',
    iconLess = '',
    iconMore = '',
    disabled = false,
  }: Props = $props();
</script>

<button
  class="btn hover:preset-tonal"
  onclick={() => (isExpanded = !isExpanded)}
  {disabled}
>
  {@html label}
  {#if isExpanded}
    {#if iconLess}
      {@html iconLess}
    {/if}
  {:else if iconMore}
    {@html iconMore}
  {/if}
  {#if !iconMore && !iconLess}
    <ChevronDownIcon class={['transition', isExpanded && 'rotate-180']} />
  {/if}
</button>
