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

<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { PUBLIC_SITE_TITLE } from '$app/env/public';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { motion } from '#lib/utils/feedback.svelte.js';
  import { cubicOut } from 'svelte/easing';

  /**
   * small: the top bar's size (the sidebar's header on wide screens), so
   * it fits over the sidebar.
   * mark: the blanket in place of the name (while the sidebar is hidden);
   * one folds away as the other opens, with the sidebar's timing.
   * viewTransition: false for a second logo on screen at once (the menu
   * drawer's), since a view transition's name can be used only once.
   * @type {{ small?: boolean, mark?: boolean, viewTransition?: boolean }}
   */
  let { small = false, mark = false, viewTransition = true } = $props();

  // The blanket's hole (a slot from the top into a circle) is cut out, so
  // whatever is behind it (the top bar) shows through
  const HOLE = `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path fill-rule='evenodd' d='M0 0H32V32H0Z M12 0H20V13.07A8 8 0 1 1 12 13.07Z'/></svg>",
  )}")`;

  // The same time, easing and fade as AppShell's sidebarSlide
  /** @param {HTMLElement} node */
  function fold(node) {
    if (motion.reduced) return { duration: 0 };
    const { width } = node.getBoundingClientRect();
    return {
      duration: 400,
      easing: cubicOut,
      /** @param {number} t */
      css: (t) =>
        `overflow: clip; width: ${t * width}px; opacity: ${Math.min(t * 3, 1)}`,
    };
  }
</script>

<!-- The site's name, or the blanket mark while the sidebar is hidden -->
<button
  class={['text-left', viewTransition && '[view-transition-name:app-logo]']}
  aria-label={PUBLIC_SITE_TITLE}
  onclick={() => {
    dialog.close();
    if (page.url.pathname !== '/') goto('/');
    else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }}
>
  <div class="mx-4 flex items-center" aria-hidden="true">
    {#if mark}
      <div class="shrink-0" transition:fold>
        <div class="w-fit overflow-hidden rounded-[0.2rem] shadow">
          <div
            class="flex size-8 flex-col"
            style:mask-image={HOLE}
            style:-webkit-mask-image={HOLE}
          >
            <!-- These are yarn colorways from the year's most popular project as of March, 2025: /gallery/14729 -->
            <div
              class="w-full flex-auto bg-gradient-to-r from-[#e77e79]/90 to-[#e77e79]"
            ></div>
            <div
              class="w-full flex-auto bg-gradient-to-r from-[#f3d488]/90 to-[#f3d488]"
            ></div>
            <div
              class="w-full flex-auto bg-gradient-to-r from-[#789fb8]/90 to-[#789fb8]"
            ></div>
            <div
              class="w-full flex-auto bg-gradient-to-r from-[#295d7d]/90 to-[#295d7d]"
            ></div>
          </div>
        </div>
      </div>
    {/if}
    {#if !mark}
      <span
        class={[
          'h5 text-surface-700 dark:text-surface-100 shrink-0 leading-tight whitespace-nowrap',
          small && 'text-lg',
        ]}
        transition:fold
      >
        {PUBLIC_SITE_TITLE}
      </span>
    {/if}
  </div>
</button>
