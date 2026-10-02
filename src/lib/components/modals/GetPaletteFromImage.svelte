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

<script lang="ts">
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import DefaultYarnSet from '$lib/components/DefaultYarnSet.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import SelectYarnWeight from '$lib/components/SelectYarnWeight.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES } from '$lib/constants/color-constants';
  import ImagePaletteCanvas from '$lib/features/image-palette/ImagePaletteCanvas.svelte';
  import {
    ImagePaletteState,
    type SortOrder,
  } from '$lib/features/image-palette/image-palette-state.svelte';
  import {
    PALETTE_STYLES,
    type PaletteStyle,
  } from '$lib/features/image-palette/select';
  import { dialog } from '$lib/state/page-state.svelte';
  import type { GaugeSettingsType } from '$lib/types/gauge-types';
  import type { Color } from '$lib/types/yarn-types';
  import {
    ArrowDownWideNarrowIcon,
    ArrowLeftRightIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    EyeIcon,
    ImagePlusIcon,
    Icon,
    PipetteIcon,
    ShuffleIcon,
    Trash2Icon,
    WandSparklesIcon,
    XIcon,
    type LucideIconNode,
  } from '@lucide/svelte';
  import {
    Menu,
    Portal,
    SegmentedControl,
  } from '@skeletonlabs/skeleton-svelte';
  import { onMount, untrack } from 'svelte';

  interface Props {
    updateGauge: (params: {
      _colors: Color[];
      _schemeId?: GaugeSettingsType['schemeId'];
    }) => void;
    numberOfColors: number;
    /** Put the warm end of a gradient first (a high-to-low gauge) */
    warmFirst?: boolean;
  }

  let { updateGauge, numberOfColors, warmFirst = true }: Props = $props();

  const palette = untrack(
    () => new ImagePaletteState({ numberOfColors, warmFirst }),
  );

  // A straight line with dots at its ends: Lucide's Spline icon, unbent
  const LINE_ICON: LucideIconNode[] = [
    ['circle', { cx: '19', cy: '5', r: '2' }],
    ['circle', { cx: '5', cy: '19', r: '2' }],
    ['path', { d: 'M6.5 17.5 17.5 6.5' }],
  ];

  const STYLES: Record<PaletteStyle, { label: string; details: string }> = {
    balanced: { label: 'Balanced', details: 'Colors from across the photo' },
    vivid: { label: 'Vivid', details: 'Favors bright, bold colors' },
    muted: { label: 'Muted', details: 'Favors soft, grayed colors' },
    light: { label: 'Light', details: 'Favors lighter colors' },
    dark: { label: 'Dark', details: 'Favors deeper colors' },
  };

  // The Sort Colors dialog's sorts, plus a gradient for photos
  const SORTS: { value: SortOrder; label: string; needsNames?: boolean }[] = [
    { value: 'gradient', label: 'Smooth Gradient' },
    { value: 'light-to-dark', label: 'Lightest to Darkest' },
    { value: 'dark-to-light', label: 'Darkest to Lightest' },
    { value: 'name', label: 'Name A-Z', needsNames: true },
    { value: 'name-z-to-a', label: 'Name Z-A', needsNames: true },
  ];

  // As in the main palette's toolbar
  const toolbarButtonClass = 'btn hover:preset-tonal-surface justify-start';
  const menuItemClass =
    'data-highlighted:bg-surface-200-800 flex items-center justify-start gap-2 text-left whitespace-normal data-highlighted:text-inherit';

  // Choose a photo first, then work with it
  let step = $state<'start' | 'editor'>('start');
  let input: HTMLInputElement | undefined = $state();
  let draggingFile = $state(false);

  let paletteColors = $derived(palette.paletteColors());
  let allColorsHaveNames = $derived(
    paletteColors.length > 0 && paletteColors.every((color) => color.name),
  );
  let highlightIndex = $derived(
    palette.points.findIndex((point) => point.id === palette.hoveredId),
  );

  onMount(() => {
    palette.init();
    return () => {
      palette.destroy();
      dialog.backAction = null;
    };
  });

  // The dialog's Back button returns to the start from the editor, and the
  // dialog widens to make room for the photo
  $effect(() => {
    dialog.backAction = step === 'editor' ? () => (step = 'start') : null;
    dialog.options.size = step === 'editor' ? 'xlarge' : 'medium';
  });

  // A photo that couldn't load leaves nothing to edit
  $effect(() => {
    if (step === 'editor' && !palette.loading && !palette.hasImage)
      step = 'start';
  });

  function open(load: () => unknown) {
    load();
    step = 'editor';
  }

  function openFile(file: File | undefined) {
    if (!file) return;
    open(() => palette.loadFile(file));
  }

  function onYarnFilterChange() {
    palette.setYarnFilter({
      brandId: palette.selectedBrandId,
      yarnId: palette.selectedYarnId,
      yarnWeightId: palette.selectedYarnWeightId,
    });
  }

  function onPaste(e: ClipboardEvent) {
    const file = Array.from(e.clipboardData?.files ?? []).find((n) =>
      n.type.startsWith('image/'),
    );
    if (!file) return;
    e.preventDefault();
    openFile(file);
  }
</script>

<!-- Stop the browser opening a dropped image that misses the drop area -->
<svelte:window
  onpaste={onPaste}
  ondragover={(e) => {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  }}
  ondrop={(e) => {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  }}
/>

<input
  type="file"
  accept="image/*"
  hidden
  bind:this={input}
  onchange={(e) => {
    const target = e.currentTarget;
    openFile(target.files?.[0]);
    // Allow choosing the same file again
    target.value = '';
  }}
/>

<div
  role="region"
  aria-label="Get colors from an image"
  ondragover={(e) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    draggingFile = true;
  }}
  ondragleave={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      draggingFile = false;
  }}
  ondrop={(e) => {
    if (!e.dataTransfer?.files.length) return;
    e.preventDefault();
    draggingFile = false;
    openFile(e.dataTransfer.files[0]);
  }}
>
  {#if step === 'start'}
    <div class="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2 pb-8">
      <p class="text-surface-700-300 text-center">
        Pick colors from a photo and match them to yarn. Photos stay on your
        device.
      </p>

      {#if palette.errorMessage}
        <p class="text-error-700-300 text-center" role="alert">
          {palette.errorMessage}
        </p>
      {/if}

      <div class="grid gap-4 sm:grid-cols-2">
        <button
          class="card preset-outlined-surface-300-700 hover:preset-tonal-surface flex flex-col items-center gap-3 p-6 text-center transition-colors"
          onclick={() => open(() => palette.randomImage())}
        >
          <span
            class="preset-tonal-primary flex size-14 items-center justify-center rounded-full"
          >
            <ShuffleIcon class="size-7" />
          </span>
          <span class="text-lg font-bold">Random Photo</span>
          <span class="text-surface-700-300 text-sm"
            >Get inspired by a photo from Unsplash</span
          >
        </button>
        <button
          class={[
            'card flex flex-col items-center gap-3 p-6 text-center transition-colors',
            draggingFile
              ? 'preset-tonal-primary outline-primary-500 outline-2 outline-dashed'
              : 'preset-outlined-surface-300-700 hover:preset-tonal-surface',
          ]}
          onclick={() => input?.click()}
        >
          <span
            class="preset-tonal-primary flex size-14 items-center justify-center rounded-full"
          >
            <ImagePlusIcon class="size-7" />
          </span>
          <span class="text-lg font-bold">Your Photo</span>
          <span class="text-surface-700-300 text-sm"
            >Choose a photo, or drop or paste one here</span
          >
        </button>
      </div>

      {#if palette.canContinue && palette.thumbnail}
        <button
          class="card preset-outlined-surface-300-700 hover:preset-tonal-surface flex items-center gap-4 p-3 text-left transition-colors"
          onclick={() =>
            open(() => {
              if (!palette.hasImage) palette.continueSaved();
            })}
        >
          <img
            src={palette.thumbnail}
            alt=""
            class="rounded-base h-14 w-20 shrink-0 object-cover"
          />
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="font-bold">Continue with your last photo</span>
            <span class="text-surface-700-300 text-sm"
              >Pick up where you left off</span
            >
          </span>
          <ChevronRightIcon class="shrink-0" />
        </button>
      {/if}

      <p class="text-surface-700-300 text-center text-xs">
        Random photos from <a
          href="https://unsplash.com"
          class="link"
          target="_blank"
          rel="nofollow noreferrer">Unsplash</a
        >
        via
        <a
          href="https://picsum.photos"
          class="link"
          target="_blank"
          rel="nofollow noreferrer">Lorem Picsum</a
        >.
      </p>
    </div>
  {:else}
    <div class="flex flex-col lg:h-[calc(92svh-4.5rem)]">
      <div
        class="flex min-h-0 flex-1 flex-col gap-4 px-2 pb-2 sm:px-4 lg:flex-row"
      >
        <section class="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              value={palette.tool}
              onValueChange={(e) => {
                if (e.value === 'points' || e.value === 'line')
                  palette.setTool(e.value);
              }}
            >
              <SegmentedControl.Control
                class="bg-surface-100 dark:bg-surface-900"
              >
                <SegmentedControl.Indicator />
                <SegmentedControl.Item value="points">
                  <SegmentedControl.ItemText class="flex items-center gap-1"
                    ><PipetteIcon class="size-4" /> Pick Colors</SegmentedControl.ItemText
                  >
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="line">
                  <SegmentedControl.ItemText class="flex items-center gap-1"
                    ><Icon iconNode={LINE_ICON} class="size-4" /> Draw a Line</SegmentedControl.ItemText
                  >
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              </SegmentedControl.Control>
            </SegmentedControl>

            <div class="flex flex-wrap items-center gap-1">
              {#if palette.source === 'random'}
                <button
                  class="btn hover:preset-tonal-surface"
                  disabled={palette.loading}
                  onclick={() => palette.randomImage()}
                >
                  <ShuffleIcon />
                  Another Photo
                </button>
              {/if}
              <button
                class={[
                  'btn',
                  palette.showYarnPreview
                    ? 'preset-tonal-primary'
                    : 'hover:preset-tonal-surface',
                ]}
                title="See the photo in only your palette's colors"
                aria-pressed={palette.showYarnPreview}
                disabled={palette.loading}
                onclick={() => palette.setYarnPreview(!palette.showYarnPreview)}
              >
                <EyeIcon />
                Palette View
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 max-lg:px-6">
            <ImagePaletteCanvas {palette} />
          </div>

          <p class="text-surface-700-300 text-center text-xs">
            {#if palette.showYarnPreview}
              Your photo in only your palette's colors.
            {:else if palette.tool === 'line'}
              Drag across the photo for evenly spaced colors. Drag an end to
              adjust.
            {:else}
              Click or tap to add a color. Drag a color to adjust it, or tap it
              for details.
            {/if}
          </p>

          {#if palette.errorMessage}
            <p class="text-error-700-300 text-center text-sm" role="alert">
              {palette.errorMessage}
            </p>
          {/if}
          {#if palette.infoMessage}
            <p class="text-center text-sm">{palette.infoMessage}</p>
          {/if}
          {#if palette.warningMessage}
            <div
              class="text-warning-900-100 flex items-center justify-center gap-1 text-sm"
            >
              <p>{palette.warningMessage}</p>
              <button
                class="btn-icon btn-icon-sm hover:preset-tonal-surface"
                aria-label="Dismiss"
                onclick={() => (palette.warningMessage = null)}
              >
                <XIcon />
              </button>
            </div>
          {/if}
        </section>

        <aside
          class="flex flex-col gap-4 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:px-1 lg:pb-2"
        >
          <div class="flex flex-col gap-1">
            <span class="label-text">Colors</span>
            <SegmentedControl
              value={palette.mode}
              onValueChange={(e) => {
                if (e.value === 'yarn' || e.value === 'exact')
                  palette.setMode(e.value);
              }}
            >
              <SegmentedControl.Control
                class="bg-surface-100 dark:bg-surface-900 w-full"
              >
                <SegmentedControl.Indicator />
                <SegmentedControl.Item value="yarn" class="flex-1">
                  <SegmentedControl.ItemText
                    >Match to Yarn</SegmentedControl.ItemText
                  >
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="exact" class="flex-1">
                  <SegmentedControl.ItemText
                    >Photo Colors</SegmentedControl.ItemText
                  >
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              </SegmentedControl.Control>
            </SegmentedControl>
          </div>

          {#if palette.yarnReady && palette.mode === 'yarn'}
            <SelectYarn
              context="modal"
              bind:selectedBrandId={palette.selectedBrandId}
              bind:selectedYarnId={palette.selectedYarnId}
              onselectautocomplete={onYarnFilterChange}
              selectedYarnWeightId={palette.selectedYarnWeightId}
            />
            {#if palette.selectedBrandId && palette.selectedYarnId}
              <DefaultYarnSet
                selectedBrandId={palette.selectedBrandId}
                selectedYarnId={palette.selectedYarnId}
              />
            {:else}
              {#key palette.selectedBrandId}
                <SelectYarnWeight
                  selectedBrandId={palette.selectedBrandId}
                  bind:selectedYarnWeightId={palette.selectedYarnWeightId}
                  onchange={onYarnFilterChange}
                />
              {/key}
            {/if}
          {/if}
        </aside>
      </div>

      <StickyPart position="bottom">
        <div class="flex flex-col gap-1 px-2 pt-2 sm:px-4">
          <!-- The palette and its tools, as on the main page -->
          <div
            class="rounded-container bg-surface-100 dark:bg-surface-900 flex w-full flex-col items-center gap-2 pb-2 shadow-inner"
          >
            {#if palette.points.length}
              <ColorPaletteEditable
                canUserEditColor={false}
                showSchemeName={false}
                roundedBottom={false}
                colors={paletteColors}
                {highlightIndex}
                onhover={(index: number | null) =>
                  (palette.hoveredId =
                    index === null
                      ? null
                      : (palette.points[index]?.id ?? null))}
                onchanged={(
                  colors: Parameters<typeof palette.syncFromColors>[0],
                ) => palette.syncFromColors(colors)}
              />
            {:else}
              <div
                class="rounded-t-container border-surface-300-700 text-surface-700-300 flex h-[70px] w-full items-center justify-center border-2 border-dashed text-sm"
              >
                Tap the photo to add colors, or use Auto Palette
              </div>
            {/if}

            <div class="flex flex-wrap items-center justify-center gap-2 px-2">
              {#key palette.points.length}
                <SelectNumberOfColors
                  numberOfColors={palette.points.length}
                  max={MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES}
                  allowZero={true}
                  onchange={(e) =>
                    palette.setCount(
                      parseInt((e.target as HTMLSelectElement).value),
                    )}
                />
              {/key}

              <Menu
                positioning={{ placement: 'top' }}
                onSelect={(details) =>
                  palette.setStyle(details.value as PaletteStyle)}
              >
                <Menu.Trigger
                  class={toolbarButtonClass}
                  title="Pick the colors that best capture the photo"
                  disabled={palette.loading || palette.working}
                >
                  <WandSparklesIcon />
                  <span class="flex items-center gap-1"
                    >Auto Palette <ChevronDownIcon size={18} /></span
                  >
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content
                      class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]"
                    >
                      {#each PALETTE_STYLES as style (style)}
                        <Menu.Item value={style} class={menuItemClass}>
                          <div class="flex min-w-0 flex-1 flex-col text-left">
                            <p>{STYLES[style].label}</p>
                            <p class="text-surface-700-300 text-xs">
                              {STYLES[style].details}
                            </p>
                          </div>
                          {#if palette.autoStyle === style}
                            <CheckIcon class="shrink-0" aria-label="Current" />
                          {/if}
                        </Menu.Item>
                      {/each}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu>

              <Menu
                positioning={{ placement: 'top' }}
                onSelect={(details) => {
                  if (details.value === 'reverse') palette.reverse();
                  else palette.sortBy(details.value as SortOrder);
                }}
              >
                <Menu.Trigger
                  class={toolbarButtonClass}
                  title="Sort Colors"
                  disabled={palette.points.length < 2}
                >
                  <ArrowDownWideNarrowIcon />
                  <span class="flex items-center gap-1"
                    >Sort <ChevronDownIcon size={18} /></span
                  >
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content
                      class="bg-surface-100-900 z-9999 max-w-[calc(100vw-2rem)]"
                    >
                      {#each SORTS.filter((sort) => allColorsHaveNames || !sort.needsNames) as sort (sort.value)}
                        <Menu.Item value={sort.value} class={menuItemClass}>
                          <p class="min-w-0 flex-1 text-left">{sort.label}</p>
                          {#if palette.sortOrder === sort.value}
                            <CheckIcon class="shrink-0" aria-label="Current" />
                          {/if}
                        </Menu.Item>
                      {/each}
                      <Menu.Separator />
                      <Menu.Item value="reverse" class={menuItemClass}>
                        <ArrowLeftRightIcon class="shrink-0" />
                        <p class="min-w-0 flex-1 text-left">Reverse</p>
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu>

              <button
                class={toolbarButtonClass}
                title="Remove all unlocked colors"
                disabled={!palette.points.some((point) => !point.locked)}
                onclick={() => palette.clear()}
              >
                <Trash2Icon />
                Clear
              </button>
            </div>
          </div>

          <SaveAndCloseButtons
            disabled={!palette.hasImage ||
              palette.loading ||
              !palette.points.length}
            onSave={() => {
              updateGauge({ _colors: palette.toColors() });
              dialog.close();
            }}
            onClose={dialog.close}
          />
        </div>
      </StickyPart>
    </div>
  {/if}
</div>
