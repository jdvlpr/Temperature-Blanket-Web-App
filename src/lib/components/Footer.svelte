<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

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
  class="m-auto grid max-w-(--breakpoint-xl) grid-cols-12 justify-center gap-4 px-2 py-4 text-left xl:px-0"
  class:bg-transparent={subtleBackground}
  class:dark:bg-transparent={subtleBackground}
>
  {#if about}
    <div class="card preset-tonal-surface col-span-full h-fit p-4 shadow-xl">
      <h3 class="mb-2 text-xl font-bold">About</h3>
      {@render about?.()}
    </div>
  {/if}

  {#if sources}
    <div class="card preset-tonal-surface col-span-full h-fit p-4 shadow-xl">
      <h3 class="mb-2 text-xl font-bold">Sources</h3>
      {@render sources?.()}
    </div>
  {/if}
</footer>
