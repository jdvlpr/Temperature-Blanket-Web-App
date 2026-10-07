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
  The active gauge's range settings, as a menu beside View: its direction,
  what each range's ends include, and whether ranges are linked. Each applies
  right away (Undo puts it back). Generating new ranges opens a dialog.
-->
<script lang="ts">
  import {
    menuContentClass,
    menuItemClass,
    menuTriggerClass,
  } from '$lib/components/menu-styles';
  import { resolve } from '$app/paths';
  import GenerateRanges from '$lib/components/modals/GenerateRanges.svelte';
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import type { GaugeRange, GaugeRangeOptions } from '$lib/types/gauge-types';
  import { withRangeOptions } from '$lib/utils/gauge-utils.svelte';
  import {
    ArrowDownNarrowWideIcon,
    ArrowDownWideNarrowIcon,
    CheckIcon,
    ChevronDownIcon,
    ExternalLinkIcon,
    Settings2Icon,
    WandSparklesIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type RangeGauge = Parameters<typeof withRangeOptions>[0];

  // The gauge's range options aren't reactive state, but they only change
  // along with its ranges (here, Generate Ranges, undo), so they're read
  // again whenever the ranges change
  let options = $derived.by(() => {
    void gauges.activeGauge?.ranges;
    const rangeOptions = gauges.activeGauge?.rangeOptions;
    return rangeOptions ? { ...rangeOptions } : null;
  });

  const directions = [
    {
      value: 'high-to-low',
      label: 'High to low',
      icon: ArrowDownWideNarrowIcon,
    },
    {
      value: 'low-to-high',
      label: 'Low to high',
      icon: ArrowDownNarrowWideIcon,
    },
  ] as const;

  const includes = [
    { from: true, to: false, label: 'From, not To', note: 'Default' },
    { from: false, to: true, label: 'To, not From' },
    { from: true, to: true, label: 'Both From and To' },
    { from: false, to: false, label: 'Neither' },
  ] as const;

  function change(
    settings: Partial<
      Pick<
        GaugeRangeOptions,
        'direction' | 'includeFromValue' | 'includeToValue' | 'linked'
      >
    >,
  ) {
    const gauge = gauges.activeGauge;
    if (!gauge?.rangeOptions || !gauge.ranges) return;
    const { rangeOptions, ranges } = withRangeOptions(
      gauge as unknown as RangeGauge,
      settings,
    );
    gauge.rangeOptions = rangeOptions;
    // Last, and always a new list: the project's URL (and so Undo) and
    // everything showing the options follow the ranges
    gauge.ranges = ranges;
  }

  function openGenerateRanges() {
    dialog.trigger({
      type: 'component',
      component: {
        ref: GenerateRanges,
        props: {
          onSave: (e: {
            ranges: GaugeRange[];
            rangeOptions: GaugeRangeOptions;
          }) => {
            const gauge = gauges.activeGauge;
            if (!gauge) return;
            gauge.rangeOptions = e.rangeOptions;
            gauge.ranges = e.ranges;
          },
        },
      },
      options: { size: 'large', title: 'Generate Ranges' },
    });
  }
</script>

<Menu
  positioning={{ placement: 'bottom-start' }}
  onSelect={(details) => {
    if (details.value === 'generate') openGenerateRanges();
  }}
>
  <Menu.Trigger class={menuTriggerClass}>
    <Settings2Icon size={18} aria-hidden="true" />
    <span>Ranges</span>
    <ChevronDownIcon size={18} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        {#if options}
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel class="text-surface-700-300 px-2 text-xs"
              >Direction</Menu.ItemGroupLabel
            >
            {#each directions as direction (direction.value)}
              {@const checked = options.direction === direction.value}
              <Menu.OptionItem
                type="radio"
                value={direction.value}
                {checked}
                onCheckedChange={() => change({ direction: direction.value })}
                class={menuItemClass}
              >
                <direction.icon size={18} class="shrink-0" aria-hidden="true" />
                <span class="min-w-0 flex-1">{direction.label}</span>
                <CheckIcon
                  size={18}
                  class="shrink-0 {checked ? '' : 'invisible'}"
                  aria-hidden="true"
                />
              </Menu.OptionItem>
            {/each}
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.ItemGroup>
            <Menu.ItemGroupLabel class="text-surface-700-300 px-2 text-xs"
              >Each range includes</Menu.ItemGroupLabel
            >
            {#each includes as include (include.label)}
              {@const checked =
                options.includeFromValue === include.from &&
                options.includeToValue === include.to}
              <Menu.OptionItem
                type="radio"
                value="{include.from}-{include.to}"
                {checked}
                onCheckedChange={() =>
                  change({
                    includeFromValue: include.from,
                    includeToValue: include.to,
                  })}
                class={menuItemClass}
              >
                <span class="min-w-0 flex-1">
                  {include.label}
                  {#if 'note' in include}
                    <span class="text-surface-700-300 text-xs"
                      >({include.note})</span
                    >
                  {/if}
                </span>
                <CheckIcon
                  size={18}
                  class="shrink-0 {checked ? '' : 'invisible'}"
                  aria-hidden="true"
                />
              </Menu.OptionItem>
            {/each}
            <Menu.Item value="how-ranges-work" class={menuItemClass}>
              {#snippet element(attributes)}
                <a
                  {...attributes as HTMLAnchorAttributes}
                  href="{resolve('/documentation')}#range-calculation-methods"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon size={16} aria-hidden="true" />
                  <span class="text-sm">How this changes the days</span>
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              {/snippet}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Separator />
          <Menu.OptionItem
            type="checkbox"
            value="linked"
            checked={options.linked}
            onCheckedChange={(checked) => change({ linked: checked })}
            class={menuItemClass}
          >
            <span class="flex min-w-0 flex-1 flex-col">
              <span>Linked ranges</span>
              <span class="text-surface-700-300 text-xs"
                >Changing one moves the next or previous one</span
              >
            </span>
            <CheckIcon
              size={18}
              class="shrink-0 {options.linked ? '' : 'invisible'}"
              aria-hidden="true"
            />
          </Menu.OptionItem>
          <Menu.Separator />
        {/if}
        <Menu.Item value="generate" class={menuItemClass}>
          <WandSparklesIcon size={18} class="shrink-0" aria-hidden="true" />
          <span>Generate Ranges…</span>
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
