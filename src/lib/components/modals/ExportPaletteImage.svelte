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
  Make an image of a palette to download, share or copy: a big preview, with
  its settings beside it (below it on phones) and its actions at the bottom.
-->
<script lang="ts">
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
    FIELD_ICON,
  } from '#lib/constants/class-constants.js';
  import CopyIcon from '#lib/components/CopyIcon.svelte';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { Flash } from '#lib/utils/feedback.svelte.js';
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    DEFAULT_PALETTE_IMAGE_SETTINGS,
    rangeToText,
    type PaletteImageLabels,
    type PaletteImageRange,
    type PaletteImageSettings,
  } from '#lib/features/palette-image/layout.js';
  import {
    canvasToBlob,
    loadPaletteImageFonts,
    renderPaletteImage,
    type PaletteImagePhoto,
  } from '#lib/features/palette-image/render.js';
  import { getPalettePhoto } from '#lib/features/image-palette/image-palette-state.svelte.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { fillWithColor } from '#lib/components/yarn-colorways/fill-with-color.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import {
    DownloadIcon,
    LayoutGridIcon,
    LayoutListIcon,
    LoaderCircleIcon,
    MoonIcon,
    RectangleHorizontalIcon,
    RectangleVerticalIcon,
    ShareIcon,
    SquareIcon,
    SunIcon,
    UnfoldVerticalIcon,
  } from '@lucide/svelte';
  import {
    Menu,
    Portal,
    SegmentedControl,
  } from '@skeletonlabs/skeleton-svelte';
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';

  interface Props {
    colors: Color[];
    /** Each color's range, when the palette is a project's gauge */
    ranges?: PaletteImageRange[];
    /** The palette's title, or a name made from its colors when it has none */
    title: string;
  }

  let { colors, ranges, title }: Props = $props();

  let paletteColors = $derived(
    colors
      .filter((color): color is Color & { hex: string } => !!color.hex)
      .map(({ hex, name, brandName, yarnName }) => ({
        hex,
        name,
        brandName,
        yarnName,
      })),
  );

  let hasYarn = $derived(
    paletteColors.some((color) => color.brandName || color.yarnName),
  );
  let hasNames = $derived(paletteColors.some((color) => color.name));
  let hasRanges = $derived(!!ranges?.some((range) => rangeToText(range)));

  // Saved settings, filled in from the defaults for anything not saved yet;
  // Fill with Color starts as it is in the editor
  const saved = preferences.value.paletteImage;
  let settings = $state<PaletteImageSettings>({
    ...DEFAULT_PALETTE_IMAGE_SETTINGS,
    fill: fillWithColor.on,
    ...saved,
    // As the View menu is, each time
    layout: preferences.value.layout,
    labels: { ...DEFAULT_PALETTE_IMAGE_SETTINGS.labels, ...saved?.labels },
  });

  // With nothing else to show, show the color codes (just this time)
  onMount(() => {
    if (!hasYarn && !hasNames && !hasRanges) settings.labels.hex = true;
  });

  /** Remember a choice for next time (but not the layout: it follows the View menu) */
  function remember() {
    const { layout: _layout, ...rest } = $state.snapshot(settings);
    preferences.value.paletteImage = rest;
  }

  // The photo the colors were picked from, while they still are its colors
  let photo = $state.raw<PaletteImagePhoto | null>(null);

  onMount(() => {
    const found = getPalettePhoto(paletteColors.map((color) => color.hex));
    if (!found) return;
    let bitmap: ImageBitmap | undefined;
    let closed = false;
    createImageBitmap(found.pixels)
      .then((image) => {
        if (closed) return image.close();
        bitmap = image;
        photo = {
          image,
          width: image.width,
          height: image.height,
          points: found.points,
        };
      })
      .catch(() => {});
    return () => {
      closed = true;
      bitmap?.close();
    };
  });

  const LAYOUTS = [
    {
      value: 'list',
      label: 'List',
      details: 'A band for each color',
      icon: LayoutListIcon,
    },
    {
      value: 'grid',
      label: 'Grid',
      details: 'A grid of tiles',
      icon: LayoutGridIcon,
    },
  ] as const;

  const SHAPES = [
    {
      value: 'fit',
      label: 'Fit',
      details: '1080 px wide, as tall as needed',
      icon: UnfoldVerticalIcon,
    },
    {
      value: 'square',
      label: 'Square',
      details: '1080 × 1080 px',
      icon: SquareIcon,
    },
    {
      value: 'portrait',
      label: 'Portrait',
      details: '1080 × 1350 px',
      icon: RectangleVerticalIcon,
    },
    {
      value: 'landscape',
      label: 'Landscape',
      details: '1920 × 1080 px',
      icon: RectangleHorizontalIcon,
    },
  ] as const;

  const BACKGROUNDS = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
  ] as const;

  let labelOptions = $derived(
    [
      hasRanges && { key: 'range', label: 'Ranges' },
      hasNames && { key: 'colorway', label: 'Colorway Names' },
      hasYarn && { key: 'yarn', label: 'Brand and Yarn' },
      { key: 'hex', label: 'HTML Color Codes' },
      { key: 'number', label: 'Color Numbers' },
    ].filter(Boolean) as { key: keyof PaletteImageLabels; label: string }[],
  );

  type Choice = {
    value: string;
    label: string;
    details: string;
    icon: Component;
  };

  // One canvas, drawn again whenever something changes; the latest PNG is
  // kept ready so Share and Copy can use it straight away when pressed
  let canvas: HTMLCanvasElement | undefined;
  let fontsReady = $state(false);
  let blob = $state<Blob | null>(null);
  let previewUrl = $state<string | null>(null);
  let renderId = 0;

  let canShare = $state(false);
  let canCopy = $state(false);

  onMount(() => {
    canvas = document.createElement('canvas');
    loadPaletteImageFonts().finally(() => (fontsReady = true));
    try {
      canShare =
        !!navigator.canShare &&
        navigator.canShare({
          files: [new File([], 'palette.png', { type: 'image/png' })],
        });
    } catch {
      canShare = false;
    }
    canCopy =
      typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      canvas = undefined;
    };
  });

  $effect(() => {
    if (!fontsReady || !canvas) return;
    const id = ++renderId;
    renderPaletteImage({
      canvas,
      colors: paletteColors,
      ranges,
      title: settings.title ? title : '',
      photo:
        photo && settings.photo
          ? { ...photo, points: settings.points ? photo.points : undefined }
          : undefined,
      settings: $state.snapshot(settings),
    });
    canvasToBlob(canvas)
      .then((next) => {
        // A later change may have drawn again in the meantime
        if (id !== renderId) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        blob = next;
        previewUrl = URL.createObjectURL(next);
      })
      .catch(() => {
        if (id === renderId) blob = null;
      });
  });

  let fileName = $derived(
    `${title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Yarn Palette'}.png`,
  );

  function download() {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = fileName;
    link.href = previewUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.trigger({ message: 'Image downloaded', category: 'success' });
  }

  async function share() {
    if (!blob) return;
    try {
      await navigator.share({
        files: [new File([blob], fileName, { type: 'image/png' })],
        title,
      });
    } catch (error) {
      // Closing the share sheet isn't an error
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.trigger({
        message: 'Unable to share the image',
        category: 'error',
      });
    }
  }

  const copied = new Flash();

  async function copy() {
    if (!blob) return;
    const ok = await copyToClipboard(
      [new ClipboardItem({ 'image/png': blob })],
      'Image copied',
      'Unable to copy the image',
    );
    if (ok) copied.trigger();
  }

  const segmentClass = 'bg-surface-100 dark:bg-surface-900 w-full';
  const toggleGroupClass =
    'bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y border border-gray-300 dark:border-gray-700';
</script>

<!-- A setting with a few choices, as the site's other selects: the current
choice's icon beside it, and what it's for below -->
{#snippet choiceSelect({
  label,
  choices,
  current,
  onchoose,
}: {
  label: string;
  choices: readonly Choice[];
  current: string;
  onchoose: (value: string) => void;
})}
  {@const chosen = choices.find((choice) => choice.value === current)}
  <div class="flex flex-col gap-1">
    <label class="label">
      <span class="label-text">{label}</span>
      <div class="relative flex items-center">
        {#if chosen}
          <chosen.icon class={FIELD_ICON} />
        {/if}
        <select
          class="select truncate pl-11"
          value={current}
          onchange={(e) => onchoose(e.currentTarget.value)}
        >
          {#each choices as choice (choice.value)}
            <option value={choice.value}>{choice.label}</option>
          {/each}
        </select>
      </div>
    </label>
    <p class="text-surface-700-300 text-xs">{chosen?.details}</p>
  </div>
{/snippet}

<div class="flex flex-col lg:h-[calc(92svh-4.5rem)]">
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-2 pb-2 sm:px-4 lg:flex-row">
    <section
      class="bg-surface-100 dark:bg-surface-900 rounded-container flex min-h-0 min-w-0 flex-1 items-center justify-center p-4 shadow-inner max-lg:h-[45svh]"
      aria-label="Preview"
    >
      {#if previewUrl}
        <img
          src={previewUrl}
          alt="Palette preview"
          class="max-h-full max-w-full object-contain shadow-md"
        />
      {:else}
        <LoaderCircleIcon class="size-8 animate-spin opacity-60" />
      {/if}
    </section>

    <aside
      class="flex flex-col gap-4 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:px-1 lg:pb-2"
    >
      {@render choiceSelect({
        label: 'Layout',
        choices: LAYOUTS,
        current: settings.layout,
        onchoose: (value) => {
          const layout = LAYOUTS.find((n) => n.value === value)?.value;
          if (!layout) return;
          settings.layout = layout;
          remember();
        },
      })}

      {@render choiceSelect({
        label: 'Shape',
        choices: SHAPES,
        current: settings.shape,
        onchoose: (value) => {
          const shape = SHAPES.find((n) => n.value === value)?.value;
          if (!shape) return;
          settings.shape = shape;
          remember();
        },
      })}

      <div class="flex flex-col gap-1">
        <span class="label-text">Background</span>
        <SegmentedControl
          value={settings.background}
          onValueChange={(e) => {
            const background = BACKGROUNDS.find(
              (n) => n.value === e.value,
            )?.value;
            if (!background) return;
            settings.background = background;
            remember();
          }}
        >
          <SegmentedControl.Control class={segmentClass}>
            <SegmentedControl.Indicator />
            {#each BACKGROUNDS as background (background.value)}
              <SegmentedControl.Item value={background.value} class="flex-1">
                <SegmentedControl.ItemText class="flex items-center gap-1"
                  ><background.icon class="shrink-0" />
                  {background.label}</SegmentedControl.ItemText
                >
                <SegmentedControl.ItemHiddenInput />
              </SegmentedControl.Item>
            {/each}
          </SegmentedControl.Control>
        </SegmentedControl>
      </div>

      <div class={toggleGroupClass}>
        <span class="label-text px-4 py-2.5">Show</span>
        <ToggleSwitch
          bare
          label="Title"
          details={title}
          bind:checked={settings.title}
          onchange={remember}
        />
        {#if photo}
          <ToggleSwitch
            bare
            label="Photo"
            details="The photo the colors were picked from"
            bind:checked={settings.photo}
            onchange={remember}
          />
          {#if settings.photo}
            <ToggleSwitch
              bare
              label="Picked Points"
              details="A dot where each color was picked"
              bind:checked={settings.points}
              onchange={remember}
            />
          {/if}
        {/if}
      </div>

      <div class={toggleGroupClass}>
        <span class="label-text px-4 py-2.5">Show on each color</span>
        {#each labelOptions as option (option.key)}
          <ToggleSwitch
            bare
            label={option.label}
            bind:checked={settings.labels[option.key]}
            onchange={remember}
          />
        {/each}
        <ToggleSwitch
          bare
          label="Fill with Color"
          bind:checked={settings.fill}
          onchange={remember}
        />
        <ToggleSwitch
          bare
          label="Space Between Colors"
          bind:checked={settings.gaps}
          onchange={remember}
        />
      </div>
    </aside>
  </div>

  <DialogFooter>
    {#if canCopy}
      <button class={BTN_SECONDARY} disabled={!blob} onclick={copy}>
        <CopyIcon copied={copied.is()} />
        Copy Image
      </button>
    {/if}
    {#if canShare}
      <button class={BTN_SECONDARY} disabled={!blob} onclick={share}>
        <ShareIcon />
        Share
      </button>
    {/if}
    <button class={BTN_PRIMARY} disabled={!previewUrl} onclick={download}>
      <DownloadIcon />
      Download
    </button>
  </DialogFooter>
</div>
