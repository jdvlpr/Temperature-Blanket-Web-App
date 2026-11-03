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
  A swatch's details, one popover for a whole grid, beside the swatch pressed
  or hovered: the color, its name, brand and yarn, and "Color 3 of 8". Closes
  on Escape, a press elsewhere, or scrolling.
-->
<script lang="ts">
  import {
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift,
  } from '@floating-ui/dom';
  import type { SwatchDetails } from './grid-color.svelte.js';
  import ColorDetails from './ColorDetails.svelte';

  let { details }: { details: SwatchDetails } = $props();

  let floating: HTMLDivElement | undefined = $state();

  $effect(() => {
    const anchor = details.anchor;
    if (!anchor || !floating) return;
    const el = floating;
    return autoUpdate(anchor, el, async () => {
      const { x, y } = await computePosition(anchor, el, {
        strategy: 'fixed',
        placement: 'right',
        middleware: [offset(6), flip(), shift({ padding: 8 })],
      });
      Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
    });
  });

  $effect(() => {
    if (!details.anchor) return;
    const close = () => details.close();
    const onkeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Only the popover, not a dialog around it
      e.preventDefault();
      e.stopPropagation();
      const anchor = details.anchor;
      close();
      anchor?.focus();
    };
    const onpointerdown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (details.anchor?.contains(target) || floating?.contains(target))
        return;
      close();
    };
    window.addEventListener('keydown', onkeydown, true);
    window.addEventListener('pointerdown', onpointerdown, true);
    window.addEventListener('scroll', close, { capture: true, passive: true });
    return () => {
      window.removeEventListener('keydown', onkeydown, true);
      window.removeEventListener('pointerdown', onpointerdown, true);
      window.removeEventListener('scroll', close, true);
    };
  });
</script>

{#if details.anchor && details.color}
  <div
    bind:this={floating}
    role="dialog"
    aria-label="{details.title}: color details"
    class="card bg-surface-100-900 border-surface-200-800 fixed top-0 left-0 z-9999 w-max max-w-64 border p-3 text-left text-sm shadow-xl"
  >
    {#if details.title}
      <p class="mb-1 text-xs opacity-70">{details.title}</p>
    {/if}
    <ColorDetails color={details.color} />
  </div>
{/if}
