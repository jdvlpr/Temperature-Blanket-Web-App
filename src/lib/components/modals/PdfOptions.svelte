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

<!-- What to put in the PDF and how it looks, beside a preview of its pages,
then download it. Laid out as the palette image's export: the preview (every
page, scrolling, drawn again a moment after each change), then the settings.
Opened by downloadPDF; its title is in the dialog's header. Layout, Fill with
color, Space between and Days in ranges start as the View menu has them; the
rest is remembered. -->

<script lang="ts">
  import { FIELD_ICON } from '#lib/constants/class-constants.js';
  import { spaced } from '#lib/components/item-spacing.js';
  import { fillWithColor } from '#lib/components/yarn-colorways/fill-with-color.js';
  import {
    DEFAULT_PDF_SETTINGS,
    defaultPageSize,
    type PdfSettings,
  } from '#lib/features/pdf/options.js';
  import type { PreviewPage } from '#lib/features/pdf/preview.js';
  import {
    allGaugesAttributes,
    gauges,
    showDaysInRange,
  } from '#lib/state/gauges-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import { ProjectStorage } from '#lib/storage/projects.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import {
    FileTextIcon,
    LayoutGridIcon,
    LayoutListIcon,
    DownloadIcon,
    LoaderCircleIcon,
  } from '@lucide/svelte';
  import { onMount, type Component } from 'svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';

  const saved = preferences.value.pdf;
  let settings = $state<PdfSettings>({
    ...DEFAULT_PDF_SETTINGS,
    pageSize: defaultPageSize(
      typeof navigator === 'undefined' ? undefined : navigator.language,
    ),
    ...saved,
    // As the View menu has them, each time
    layout: preferences.value.layout,
    fill: fillWithColor.on,
    spaced: spaced(preferences.value.layout),
    showDaysInRange: showDaysInRange.value,
  });
  let gaugeIds = $state(gauges.allCreated.map((gauge) => gauge.id));

  // The saved project's name, for the summary page's title
  let name = $state('');
  onMount(async () => {
    name = (await ProjectStorage.getById(project.id))?.name ?? '';
  });

  let hasExtras = $derived(previews.extraColors.length > 0);
  let isEmpty = $derived(
    !settings.summary &&
      !gaugeIds.length &&
      !(hasExtras && settings.additionalColors) &&
      !settings.weatherDataParams.length,
  );

  /** Remember the choices for next time (but not those the View menu sets) */
  function remember() {
    const {
      layout: _layout,
      fill: _fill,
      spaced: _spaced,
      showDaysInRange: _days,
      ...rest
    } = $state.snapshot(settings);
    preferences.value.pdf = rest;
  }

  async function download() {
    remember();
    dialog.close();
    try {
      const { createPdf } = await import('#lib/features/pdf/create.js');
      await createPdf({
        settings: $state.snapshot(settings),
        gaugeIds: $state.snapshot(gaugeIds),
        name,
      });
    } catch (e) {
      console.warn("Can't create the PDF", { e });
      toast.trigger({ message: 'Unable to create the PDF', category: 'error' });
    }
  }

  // The preview: the pages shown stay until the next ones are ready, so it
  // doesn't flash empty while it's drawn again
  /** How wide pages are drawn, in CSS pixels; they shrink to fit */
  const PAGE_WIDTH = 640;
  /** A pause after a change, so a few quick changes draw once */
  const DELAY = 400;
  let pages = $state.raw<PreviewPage[]>([]);
  let updating = $state(true);
  let failed = $state(false);
  let previewId = 0;

  onMount(() => () => {
    previewId++;
    import('#lib/features/pdf/preview.js').then(({ revokePages }) =>
      revokePages(pages),
    );
  });

  $effect(() => {
    const chosen = {
      settings: $state.snapshot(settings),
      gaugeIds: $state.snapshot(gaugeIds),
      name,
    };
    if (isEmpty) {
      previewId++;
      updating = false;
      return;
    }
    const id = ++previewId;
    updating = true;
    const timer = setTimeout(async () => {
      try {
        const [{ createPdf }, { renderPages, revokePages }] = await Promise.all(
          [
            import('#lib/features/pdf/create.js'),
            import('#lib/features/pdf/preview.js'),
          ],
        );
        const doc = await createPdf({ ...chosen, download: false });
        if (id !== previewId) return;
        const next = await renderPages(
          doc.output('arraybuffer'),
          PAGE_WIDTH,
          () => id !== previewId,
        );
        if (!next) return;
        revokePages(pages);
        pages = next;
        failed = false;
      } catch (e) {
        if (id !== previewId) return;
        console.warn("Can't preview the PDF", { e });
        failed = true;
      }
      updating = false;
    }, DELAY);
    return () => clearTimeout(timer);
  });

  type Choice = {
    value: string;
    label: string;
    details: string;
    icon: Component;
  };

  const LAYOUTS: Choice[] = [
    {
      value: 'list',
      label: 'List',
      details: 'A row for each color',
      icon: LayoutListIcon,
    },
    {
      value: 'grid',
      label: 'Grid',
      details: 'A card for each color',
      icon: LayoutGridIcon,
    },
  ];

  const PAGE_SIZES: Choice[] = [
    {
      value: 'letter',
      label: 'US Letter',
      details: '8.5 × 11 inches',
      icon: FileTextIcon,
    },
    {
      value: 'a4',
      label: 'A4',
      details: '210 × 297 mm',
      icon: FileTextIcon,
    },
  ];
</script>

<!-- A setting with a few choices, as the palette image's: the current
choice's icon beside it, and what it's for below -->
{#snippet choiceSelect({
  label,
  choices,
  current,
  onchoose,
}: {
  label: string;
  choices: Choice[];
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

{#snippet check(
  label: string,
  details: string | null,
  checked: boolean,
  onchange: (checked: boolean) => void,
)}
  <label class="flex items-start gap-2">
    <input
      type="checkbox"
      class="checkbox mt-0.5"
      {checked}
      onchange={(e) => onchange(e.currentTarget.checked)}
    />
    <span class="flex flex-col">
      <span>{label}</span>
      {#if details}
        <span class="text-surface-700-300 text-xs">{details}</span>
      {/if}
    </span>
  </label>
{/snippet}

<div class="flex flex-col lg:h-[calc(92svh-4.5rem)]">
  <div class="flex min-h-0 flex-1 flex-col gap-4 px-2 pb-2 sm:px-4 lg:flex-row">
    <section
      class="bg-surface-100 dark:bg-surface-900 rounded-container relative min-h-0 min-w-0 shrink-0 overflow-y-auto p-4 shadow-inner max-lg:h-[45svh] lg:flex-1"
      aria-label="Preview"
      aria-busy={updating}
    >
      {#if isEmpty}
        <p
          class="text-surface-700-300 flex h-full items-center justify-center text-center"
        >
          Nothing to put in it yet: choose something under Include.
        </p>
      {:else if failed}
        <p
          class="text-surface-700-300 flex h-full items-center justify-center text-center"
        >
          The preview couldn't be drawn. You can still download the PDF.
        </p>
      {:else if pages.length}
        <div
          class="flex flex-col items-center gap-4 transition-opacity {updating
            ? 'opacity-60'
            : ''}"
        >
          {#each pages as page, index (page.url)}
            <img
              src={page.url}
              alt="Page {index + 1} of {pages.length}"
              width={page.width}
              height={page.height}
              class="h-auto w-full bg-white shadow-md"
              style:max-width="{PAGE_WIDTH}px"
            />
          {/each}
        </div>
      {/if}
      {#if updating && !isEmpty}
        <!-- Over the pages while they're drawn again, or alone the first time -->
        <div
          class="pointer-events-none sticky bottom-0 flex justify-center {pages.length
            ? ''
            : 'h-full items-center'}"
        >
          <LoaderCircleIcon class="size-8 animate-spin opacity-60" />
        </div>
      {/if}
      <p class="sr-only" aria-live="polite">
        {!updating && pages.length
          ? `Preview: ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`
          : ''}
      </p>
    </section>

    <aside
      class="flex flex-col gap-5 lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:px-1 lg:pb-2"
    >
      <!-- What's in it -->
      <div class="flex flex-col gap-2">
        <p class="font-bold">Include</p>
        {@render check(
          'Summary page',
          'Project, places and dates, and preview',
          settings.summary,
          (checked) => (settings.summary = checked),
        )}
        {#each gauges.allCreated as { id, label } (id)}
          {@render check(
            label,
            'Colors and ranges',
            gaugeIds.includes(id),
            (checked) =>
              (gaugeIds = checked
                ? gauges.allCreated
                    .map((gauge) => gauge.id)
                    .filter((g) => g === id || gaugeIds.includes(g))
                : gaugeIds.filter((g) => g !== id)),
          )}
        {/each}
        {#if hasExtras}
          {@render check(
            'Additional colors',
            "The preview's border and accent colors",
            settings.additionalColors,
            (checked) => (settings.additionalColors = checked),
          )}
        {/if}
        <fieldset class="flex flex-col gap-1">
          <legend class="mb-1">
            Weather data
            <span class="text-surface-700-300 block text-xs">
              A table of every {weather.grouping}, with each value's color
            </span>
          </legend>
          <div class="flex flex-wrap gap-x-4 gap-y-1">
            {#each allGaugesAttributes as { targets } (targets)}
              {#each targets as { id, label } (id)}
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox"
                    value={id}
                    bind:group={settings.weatherDataParams}
                  />
                  <span>{label}</span>
                </label>
              {/each}
            {/each}
          </div>
        </fieldset>
      </div>

      <!-- How it looks -->
      <div class="flex flex-col gap-3">
        <p class="font-bold">Look</p>
        {@render choiceSelect({
          label: 'Colors',
          choices: LAYOUTS,
          current: settings.layout,
          // Space between as the View menu has it for that layout
          onchoose: (value) => {
            settings.layout = value as PdfSettings['layout'];
            settings.spaced = spaced(settings.layout);
          },
        })}
        {@render choiceSelect({
          label: 'Page Size',
          choices: PAGE_SIZES,
          current: settings.pageSize,
          onchoose: (value) =>
            (settings.pageSize = value as PdfSettings['pageSize']),
        })}
        {@render check(
          'Fill with color',
          "Each color's row or card takes its color (uses more ink)",
          settings.fill,
          (checked) => (settings.fill = checked),
        )}
        {@render check(
          'Space between colors',
          settings.layout === 'grid'
            ? 'Cards apart, rather than in one block'
            : 'Rows apart, rather than in one block',
          settings.spaced,
          (checked) => (settings.spaced = checked),
        )}
        {#if gaugeIds.length}
          {@render check(
            'Days in ranges',
            `How many ${weather.grouping}s fall in each range`,
            settings.showDaysInRange,
            (checked) => (settings.showDaysInRange = checked),
          )}
        {/if}
        {@render check(
          'HTML color codes',
          null,
          settings.hex,
          (checked) => (settings.hex = checked),
        )}
      </div>
    </aside>
  </div>

  <SaveAndCloseButtons
    saveText="Download"
    icon={DownloadIcon}
    disabled={isEmpty}
    onSave={download}
    onClose={dialog.dismiss}
  />
</div>
