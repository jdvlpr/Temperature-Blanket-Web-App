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
    isExpanded?: boolean;
    less?: string;
    more?: string;
    iconLess?: any;
    iconMore?: any;
    disabled?: boolean;
  }

  let {
    isExpanded = $bindable(false),
    less = 'Show Less',
    more = 'Show All',
    iconLess = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>`,
    iconMore = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`,
    disabled = false,
  }: Props = $props();
</script>

<button
  class="btn hover:preset-tonal"
  onclick={() => (isExpanded = !isExpanded)}
  {disabled}
>
  {#if isExpanded}
    {@html less}
    {@html iconLess}
  {:else}
    {@html more}
    {@html iconMore}
  {/if}
</button>
