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
  import { dialog } from '$lib/state';
  import { RulerIcon } from '@lucide/svelte';
  import type { Component } from 'svelte';

  interface Props {
    value: number;
    title: string;
    min?: number | undefined;
    max?: number | undefined;
    icon?: Component | undefined;
  }
  let { value = $bindable(), title, min, max, icon = RulerIcon }: Props = $props();
  
  let iconcomponent = $derived({
    ref: icon,
  });
</script>

<button
  class="btn hover:preset-tonal"
  title="Set {title}"
  onclick={() =>
    dialog.trigger({
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
  <iconcomponent.ref/>
  {title}: {value}
</button>
