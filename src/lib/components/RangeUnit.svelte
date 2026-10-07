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
  A range number's unit, small. A temperature's lines up with the top of its
  number, as in 72°F (its caps are about a quarter of its size shorter);
  others sit on its baseline. Dimmed only on the surface: on a color
  (`filled`) it could lose its contrast.
-->
<script lang="ts">
  interface Props {
    label: string;
    type?: string;
    filled?: boolean;
  }

  let { label, type, filled = false }: Props = $props();
</script>

{#if label}<span
    class={[
      'text-xs font-normal',
      !filled && 'opacity-70',
      type === 'temperature' && 'align-[0.25em] leading-none',
    ]}>{label}</span
  >{/if}
