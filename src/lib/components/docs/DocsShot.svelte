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

<!-- A screenshot in Guides & Help, light or dark to match the site: by the
site's own .dark (its theme setting), not the device's, so choosing a theme
in Preferences shows the matching shots. Only the shown one loads (lazy
images that aren't displayed aren't fetched). Files are
/images/docs/<src>-light.png and -dark.png. -->

<script lang="ts">
  let {
    src,
    alt,
    caption,
    width,
    height,
  }: {
    src: string;
    alt: string;
    caption?: string;
    width: number;
    height: number;
  } = $props();
</script>

<figure class="flex flex-col gap-2">
  {#each [{ theme: 'light', show: 'dark:hidden' }, { theme: 'dark', show: 'hidden dark:block' }] as { theme, show } (theme)}
    <img
      src="/images/docs/{src}-{theme}.png"
      {alt}
      {width}
      {height}
      loading="lazy"
      class={[
        'rounded-container border-surface-200-800 h-auto w-full border',
        show,
      ]}
    />
  {/each}
  {#if caption}
    <figcaption class="text-sm opacity-80">{caption}</figcaption>
  {/if}
</figure>
