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

<!-- Yarn Palette Creator: routes/yarn (+page, PaletteMenu,
PaletteStatusButton, PaletteTitle, autosave). -->

<script lang="ts">
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
</script>

<p>
  The <a href="/yarn" class="link">Yarn Palette Creator</a> makes a palette on
  its own, without a project: to plan colors before you have a place and dates,
  to match yarn you already have, or to share a palette with others. Open it
  from
  <span class="font-bold">Create</span>, then
  <span class="font-bold">Palette</span>, in the site menu.
</p>

<section class="flex flex-col gap-3">
  <h2 id="make-a-palette" class="text-2xl font-bold">Make a Palette</h2>
  <p>
    It works like a project's gauge, without ranges. Press
    <span class="font-bold">Get Colors</span> for
    <span class="font-bold">Preset Gradients</span>,
    <span class="font-bold">Choose Colorways</span>,
    <span class="font-bold">From an Image</span>,
    <span class="font-bold">Random</span> or
    <span class="font-bold">Paste Colors or Code</span>; then change, move, sort
    and add colors as in a gauge. See
    <a href="/documentation/colors-and-yarn" class="link">Colors & Yarn</a> for each
    of these.
  </p>
  <p>
    <span class="font-bold">Undo</span> and <span class="font-bold">Redo</span>
    are at the top (<kbd class="kbd">⌘ Cmd</kbd>/<kbd class="kbd">Ctrl</kbd> +
    <kbd class="kbd">z</kbd>, and with <kbd class="kbd">Shift</kbd> to redo). To rename
    the palette, press the pencil beside its name.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="save-a-palette" class="text-2xl font-bold">Saving</h2>
  <p>
    A new palette isn't saved, so trying things out doesn't fill your library.
    Press <span class="font-bold">Save Palette</span> to keep it in My Library. From
    then on, changes save automatically a moment after you stop.
  </p>
  <p>
    The <span class="font-bold">Palette</span> button at the top shows where
    it's saved:
    <span class="font-bold">Saved in this browser</span
    >{#if __ACCOUNTS_ENABLED__}
      or <span class="font-bold">Saved to your account</span>{/if}. If it says
    <span class="font-bold">Not saved</span>, press it, then
    <span class="font-bold">Try Again</span>.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="palette-menu" class="text-2xl font-bold">The Palette Menu</h2>
  <p>Press <span class="font-bold">Palette</span> at the top for:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Download:</span> an image, the color codes, or the yarn
      names.
    </li>
    <li>
      <span class="font-bold">Start a Project with It:</span> opens the Project Planner
      with this palette on the temperature gauge.
    </li>
    <li>
      <span class="font-bold">Share:</span>
      <span class="font-bold">Copy Link</span>{#if __ACCOUNTS_ENABLED__}, and
        publish it to the gallery or edit its gallery page{/if}.
      <a href="/documentation/gallery-and-ravelry" class="link"
        >Gallery & Ravelry</a
      >.
    </li>
    <li>
      <span class="font-bold">New Palette</span>,
      <span class="font-bold">Open…</span> (one of your saved palettes),
      <span class="font-bold">Duplicate</span> (a copy, leaving this one as it
      is), and <span class="font-bold">Move to Trash</span>.
    </li>
    <li>Getting Started, Keyboard Shortcuts and Guides & Help.</li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="palette-in-a-project" class="text-2xl font-bold">
    Palettes and Projects
  </h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      To use a saved palette in a project, press
      <span class="font-bold">Get Colors</span> on a gauge, then
      <span class="font-bold">My Palettes</span>.
    </li>
    <li>
      To keep a project's colors as a palette, press
      <span class="font-bold">Project</span>, then the gauge under
      <span class="font-bold">Palettes</span>, then
      <span class="font-bold">Save to My Palettes</span>.
    </li>
    <li>
      A palette and the projects using it are separate: changing one doesn't
      change the other.
    </li>
  </ul>
</section>

<RelatedGuides slugs={['match-your-yarn', 'publish-and-share']} />
