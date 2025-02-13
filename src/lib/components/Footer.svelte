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
    subtleBackground?: boolean;
    about?: import('svelte').Snippet;
    sources?: import('svelte').Snippet;
  }

  let { subtleBackground = true, about, sources }: Props = $props();
</script>

<footer
  class="base-font-color py-4 max-w-screen-xl m-auto px-2 xl:px-0 text-left grid grid-cols-12 justify-center gap-4"
  class:bg-transparent={subtleBackground}
  class:dark:bg-transparent={subtleBackground}
>
  {#if about}
    <div class="card h-fit preset-tonal-surface p-4 base-font-color col-span-full">
      <h3 class="font-bold text-xl mb-2">About</h3>
      {@render about?.()}
    </div>
  {/if}

  {#if sources}
    <div class="card preset-tonal-surface p-4 h-fit base-font-color col-span-full">
      <h3 class="font-bold text-xl mb-2">Sources</h3>
      {@render sources?.()}
    </div>
  {/if}
</footer>
