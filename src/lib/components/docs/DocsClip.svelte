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

<!-- A short silent clip in Guides & Help, like DocsShot but moving: light or
dark by the site's own .dark, looping while it's in view, with a button to
pause it. With motion reduced it waits on its first frame for Play. Nothing
loads until it's near: then the poster, and the video once it plays (only
the theme shown). Files are /images/docs/<src>-light.mp4 and -dark.mp4, with
-light.jpg and -dark.jpg as posters, recorded by scripts/docs-screenshots.ts
(CLIPS), which writes their sizes to docs-shots.json. -->

<script lang="ts">
  import SHOTS from '#lib/docs/docs-shots.json';
  import { PauseIcon, PlayIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    src,
    alt,
    caption,
  }: {
    /** <page>/<clip>, as scripts/docs-screenshots.ts names it */
    src: keyof typeof SHOTS;
    alt: string;
    caption?: string;
  } = $props();

  const { width, height } = $derived(SHOTS[src]);

  let figure: HTMLElement;
  let videos: HTMLVideoElement[] = $state([]);
  /** Close enough to load its poster */
  let near = $state(false);
  /** The site's theme, so only its poster loads */
  let dark = $state(false);
  let inView = false;
  /** Whether it's meant to play: off by Pause, or to start with when motion is reduced */
  let wanted = $state(true);
  let playing = $state(false);

  /** Plays the one shown, while it's wanted and in view; pauses the rest */
  function update() {
    dark = document.documentElement.classList.contains('dark');
    for (const video of videos) {
      if (!video) continue;
      if (wanted && inView && video.checkVisibility())
        video.play().catch(() => (playing = false));
      else video.pause();
    }
  }

  function toggle() {
    wanted = !playing;
    update();
  }

  onMount(() => {
    wanted = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    dark = document.documentElement.classList.contains('dark');
    const nearby = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          near = true;
          nearby.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    const visible = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { threshold: 0.5 },
    );
    // A theme change shows the other video
    const theme = new MutationObserver(update);
    nearby.observe(figure);
    visible.observe(figure);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => {
      nearby.disconnect();
      visible.disconnect();
      theme.disconnect();
    };
  });
</script>

<figure bind:this={figure} class="flex flex-col items-center gap-2">
  <div class="relative max-w-full">
    {#each [{ theme: 'light', show: 'dark:hidden' }, { theme: 'dark', show: 'hidden dark:block' }] as { theme, show }, i (theme)}
      <video
        bind:this={videos[i]}
        src="/images/docs/{src}-{theme}.mp4"
        poster={near && (theme === 'dark') === dark
          ? `/images/docs/${src}-${theme}.jpg`
          : undefined}
        aria-label={alt}
        {width}
        {height}
        muted
        loop
        playsinline
        disablepictureinpicture
        preload="none"
        onplay={() => (playing = true)}
        onpause={() => (playing = false)}
        class={[
          'rounded-container border-surface-200-800 bg-surface-100-900 h-auto max-w-full border',
          show,
        ]}
      ></video>
    {/each}
    <button
      type="button"
      class="btn-icon preset-filled-surface-950-50 absolute right-2 bottom-2 opacity-80 shadow hover:opacity-100"
      onclick={toggle}
      aria-label={playing ? 'Pause' : 'Play'}
      title={playing ? 'Pause' : 'Play'}
    >
      {#if playing}
        <PauseIcon />
      {:else}
        <PlayIcon />
      {/if}
    </button>
  </div>
  {#if caption}
    <figcaption class="text-sm opacity-80">{caption}</figcaption>
  {/if}
</figure>
