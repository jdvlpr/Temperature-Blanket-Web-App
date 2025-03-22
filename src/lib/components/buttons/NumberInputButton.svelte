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
  import NumberInput from '$lib/components/modals/NumberInput.svelte';
  import { modal } from '$lib/state';

  interface Props {
    value: number;
    title: string;
    min?: number | undefined;
    max?: number | undefined;
    icon?: boolean | string;
  }

  let { value = $bindable(), title, min, max, icon }: Props = $props();

  if (icon === true)
    icon = `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler size-6"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>`;
  else icon = icon;
</script>

<button
  class="btn hover:preset-tonal"
  title="Set {title}"
  onclick={() =>
    modal.trigger({
      type: 'component',
      component: {
        ref: NumberInput,
        props: {
          value,
          title,
          min,
          max,
          onOkay: (_value) => {
            value = _value;
          },
        },
      },
    })}
>
  {#if icon}
    {@html icon}
  {/if}
  {title}: {value}
</button>
