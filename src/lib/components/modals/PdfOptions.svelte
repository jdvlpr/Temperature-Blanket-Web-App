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

<!-- What to put in the PDF and how it looks, then download it. Opened by
downloadPDF; its title is in the dialog's header. Layout, Fill with color and
Days in ranges start as the View menu has them; the rest is remembered. -->

<script lang="ts">
  import { fillWithColor } from '$lib/components/yarn-colorways/fill-with-color';
  import {
    DEFAULT_PDF_SETTINGS,
    defaultPageSize,
    type PdfSettings,
  } from '$lib/features/pdf/options';
  import {
    allGaugesAttributes,
    gauges,
    showDaysInRange,
  } from '$lib/state/gauges-state.svelte';
  import { dialog, toast } from '$lib/state/page-state.svelte';
  import { previews } from '$lib/state/preview-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { ProjectStorage } from '$lib/storage/projects.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { weather } from '$lib/state/weather-state.svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import {
    ChevronDownIcon,
    FileTextIcon,
    LayoutGridIcon,
    LayoutListIcon,
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

  // The PDF's pages in a few words, as they're chosen
  let contents = $derived.by(() => {
    const lines: string[] = [];
    if (settings.summary)
      lines.push('A summary page with your project and its preview');
    const chosen = gauges.allCreated.filter((g) => gaugeIds.includes(g.id));
    if (chosen.length) {
      const names = chosen.map((g) => g.label).join(' and ');
      const extras =
        settings.showDaysInRange && weather.data.length
          ? `, with ${weather.grouping}s in each range`
          : '';
      lines.push(
        `${names} colors and ranges, as a ${settings.layout === 'grid' ? 'grid of cards' : 'list'}${extras}`,
      );
    }
    if (hasExtras && settings.additionalColors)
      lines.push("The preview's border and accent colors");
    const columns = allGaugesAttributes
      .flatMap((gauge) => gauge.targets)
      .filter((target) => settings.weatherDataParams.includes(target.id))
      .map((target) => target.label);
    if (columns.length) lines.push(`A weather table: ${columns.join(', ')}`);
    if (lines.length)
      lines.push(
        `On ${settings.pageSize === 'letter' ? 'US Letter' : 'A4'} paper`,
      );
    return lines;
  });

  /** Remember the choices for next time (but not those the View menu sets) */
  function remember() {
    const {
      layout: _layout,
      fill: _fill,
      showDaysInRange: _days,
      ...rest
    } = $state.snapshot(settings);
    preferences.value.pdf = rest;
  }

  async function download() {
    remember();
    dialog.close();
    try {
      const { createPdf } = await import('$lib/features/pdf/create');
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
          <chosen.icon class="pointer-events-none absolute left-2" />
        {/if}
        <select
          class="select truncate pl-10"
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

{#snippet indicator()}
  <Accordion.ItemIndicator>
    <ChevronDownIcon
      class="h-5 w-5 transition group-data-[state=open]:rotate-180"
    />
  </Accordion.ItemIndicator>
{/snippet}

<div class="flex flex-col gap-4 p-4 pt-2">
  <!-- What the PDF will have, in a few words, so the defaults can just be downloaded -->
  <div class="flex flex-col gap-1">
    <p class="font-bold">Your PDF will have</p>
    {#if contents.length}
      <ul class="flex list-disc flex-col gap-0.5 pl-5">
        {#each contents as line (line)}
          <li>{line}</li>
        {/each}
      </ul>
    {:else}
      <p class="text-surface-700-300">
        Nothing yet: choose something to include under Customize.
      </p>
    {/if}
  </div>

  <Accordion collapsible>
    <Accordion.Item value="customize" class="group gap-0">
      <h3>
        <Accordion.ItemTrigger
          class="flex items-center justify-between font-bold"
        >
          Customize
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent>
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div
              {...attributes}
              transition:safeSlide
              class="flex flex-col gap-5 pt-2"
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
                      A table of every {weather.grouping}, with each value's
                      color
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
                <div class="grid gap-3 sm:grid-cols-2">
                  {@render choiceSelect({
                    label: 'Colors',
                    choices: LAYOUTS,
                    current: settings.layout,
                    onchoose: (value) =>
                      (settings.layout = value as PdfSettings['layout']),
                  })}
                  {@render choiceSelect({
                    label: 'Page Size',
                    choices: PAGE_SIZES,
                    current: settings.pageSize,
                    onchoose: (value) =>
                      (settings.pageSize = value as PdfSettings['pageSize']),
                  })}
                </div>
                {@render check(
                  'Fill with color',
                  "Each color's row or card takes its color (uses more ink)",
                  settings.fill,
                  (checked) => (settings.fill = checked),
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
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion>

  <SaveAndCloseButtons
    saveText="Download"
    disabled={isEmpty}
    onSave={download}
    onClose={dialog.dismiss}
  />
</div>
