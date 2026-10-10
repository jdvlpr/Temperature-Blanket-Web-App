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
  The active gauge's range settings, as a menu beside View: how its ranges
  are generated, their direction, what each range's ends include, and whether
  ranges are linked. Each applies right away (Undo puts it back), and the list
  of colors shows the result. Manual steps' numbers are set under the menu.
-->
<script lang="ts">
  import {
    menuContentClass,
    menuItemClass,
    menuTriggerClass,
  } from '$lib/components/menu-styles';
  import { resolve } from '$app/paths';
  import MenuSubmenu from '$lib/components/buttons/MenuSubmenu.svelte';
  import { provideMenuDrill } from '$lib/components/menu-drill.svelte';
  import {
    confirmGaugeChange,
    gaugeChangeState,
    type GaugeChangeState,
  } from '$lib/utils/history-utils.svelte';
  import MenuCheckbox from '$lib/components/buttons/MenuCheckbox.svelte';
  import { gauges, manualRangesEditor } from '$lib/state/gauges-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import type { GaugeRangeOptions } from '$lib/types/gauge-types';
  import {
    describeIncrement,
    withGeneratedRanges,
    withRangeOptions,
    type RangeGeneration,
  } from '$lib/utils/gauge-utils.svelte';
  import {
  ArrowDown10Icon,
    ArrowDownNarrowWideIcon,
    ArrowDownWideNarrowIcon,
    ArrowUp01Icon,
    BracketsIcon,
    CheckIcon,
    ChevronDownIcon,
    DecimalsArrowLeftIcon,
    ExternalLinkIcon,
    Link2Icon,
    RulerIcon,
    Settings2Icon,
    WandSparklesIcon,
    WrenchIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type RangeGauge = Parameters<typeof withRangeOptions>[0];

  // On a phone, Generate and Each range includes open in the menu's place
  const drill = provideMenuDrill();

  // The gauge's range options aren't reactive state, but they only change
  // along with its ranges (here, the manual steps, undo), so they're read
  // again whenever the ranges change
  let options = $derived.by(() => {
    void gauges.activeGauge?.ranges;
    const rangeOptions = gauges.activeGauge?.rangeOptions;
    return rangeOptions ? structuredClone($state.snapshot(rangeOptions)) : null;
  });

  let unitLabel = $derived(
    gauges.activeGauge?.unit.label[preferences.value.units ?? 'metric'] ?? '',
  );

  // Ways to generate ranges: even steps, (temperature only) a similar number
  // of days for each target, or manual steps
  let generations = $derived.by(() => {
    const gauge = gauges.activeGauge;
    if (!options || !gauge?.autoRangeOptions) return [];
    const step = describeIncrement(options, gauge.autoRangeOptions);
    const list: {
      value: string;
      label: string;
      note: string;
      /** A lucide icon, or a target's own mark (↑ ~ ↓), as in the days counts */
      icon: typeof RulerIcon | string;
      generation: RangeGeneration;
    }[] = [
      {
        value: 'ranges',
        label: 'Even steps',
        icon: RulerIcon,
        note: `${step} ${unitLabel} each (auto-calculated from your weather)`,
        generation: { mode: 'auto', optimization: 'ranges' },
      },
    ];
    if (gauge.id === 'temp')
      for (const target of gauge.targets) {
        if (
          target.id !== 'tmax' &&
          target.id !== 'tavg' &&
          target.id !== 'tmin'
        )
          continue;
        list.push({
          value: target.id,
          label: `Even days · ${target.label}`,
          icon: target.icon,
          note: `Approximately equal number of ${target.label.toLowerCase()} days in each range`,
          generation: { mode: 'auto', optimization: target.id },
        });
      }
    list.push({
      value: 'manual',
      label: 'Manual steps…',
      icon: WrenchIcon,
      // Its numbers are set under the menu, so it says they can be changed
      note:
        options.mode === 'manual' && !options.isCustomRanges
          ? `Every ${options.manual.increment} ${unitLabel} from ${options.manual.start} ${unitLabel} · tap to change`
          : 'Set your own step and starting value',
      generation: { mode: 'manual' },
    });
    return list;
  });

  let generatedAs = $derived(
    !options || options.isCustomRanges
      ? null
      : options.mode === 'manual'
        ? 'manual'
        : options.auto.optimization,
  );

  let generatedLabel = $derived(
    generations.find((g) => g.value === generatedAs)?.label.replace('…', '') ??
      'Custom ranges',
  );

  // Rounding only matters for Automatic ranges whose step isn't whole
  let canRound = $derived(
    !!options &&
      !!generatedAs &&
      generatedAs !== 'manual' &&
      Math.floor(options.auto.increment) !== Math.ceil(options.auto.increment),
  );

  // A toast confirms each change, except a toggle (Linked, Round numbers),
  // whose box already shows it took
  function save(
    { rangeOptions, ranges }: ReturnType<typeof withRangeOptions>,
    { confirm = true } = {},
  ) {
    const gauge = gauges.activeGauge;
    if (!gauge) return;
    const before = gaugeChangeState(gauge as GaugeChangeState);
    gauge.rangeOptions = rangeOptions;
    // Last, and always a new list: the project's URL (and so Undo) and
    // everything showing the options follow the ranges
    gauge.ranges = ranges;
    if (confirm)
      confirmGaugeChange(
        gauge.id,
        before,
        gaugeChangeState(gauge as GaugeChangeState),
      );
  }

  // Manual steps only open their numbers under the menu; Save there keeps them
  function generate(generation: RangeGeneration) {
    const gauge = gauges.activeGauge;
    if (!gauge?.rangeOptions || !gauge.ranges) return;
    if (generation.mode === 'manual') {
      manualRangesEditor.gaugeId = gauge.id;
      return;
    }
    manualRangesEditor.gaugeId = null;
    save(withGeneratedRanges(gauge as unknown as RangeGauge, generation), {
      confirm: generation.roundIncrement === undefined,
    });
  }

  const directions = [
    {
      value: 'high-to-low',
      label: 'High to low',
      icon: ArrowDown10Icon,
    },
    {
      value: 'low-to-high',
      label: 'Low to high',
      icon: ArrowUp01Icon,
    },
  ] as const;

  const includes = [
    // Each with its interval notation: [ includes an end, ( leaves it out
    {
      from: true,
      to: false,
      notation: '[)',
      label: 'From, not To',
      note: 'Default',
    },
    { from: false, to: true, notation: '(]', label: 'To, not From' },
    { from: true, to: true, notation: '[]', label: 'Both From and To' },
    { from: false, to: false, notation: '()', label: 'Neither' },
  ] as const;

  // The current choice, shown on the Each range includes row
  let included = $derived(
    includes.find(
      (i) =>
        i.from === options?.includeFromValue &&
        i.to === options?.includeToValue,
    ),
  );

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
    save(withRangeOptions(gauge as unknown as RangeGauge, settings), {
      confirm: settings.linked === undefined,
    });
  }
</script>

<!-- One way to generate ranges, in the Generate ranges submenu -->
{#snippet choice(item: (typeof generations)[number])}
  {@const checked = generatedAs === item.value}
  <Menu.OptionItem
    type="radio"
    value="generate-{item.value}"
    {checked}
    onCheckedChange={() => generate(item.generation)}
    class={menuItemClass}
  >
    {#if typeof item.icon === 'string'}
      <span
        class="w-[18px] shrink-0 text-center font-semibold"
        aria-hidden="true">{item.icon}</span
      >
    {:else}
      <item.icon  class="shrink-0" aria-hidden="true" />
    {/if}
    <span class="flex min-w-0 flex-1 flex-col">
      <span>{item.label}</span>
      <span class="text-surface-700-300 text-xs">{item.note}</span>
    </span>
    <CheckIcon

      class="shrink-0 {checked ? '' : 'invisible'}"
      aria-hidden="true"
    />
  </Menu.OptionItem>
{/snippet}

<Menu
  positioning={{ placement: 'bottom-start' }}
  onOpenChange={({ open }) => {
    if (!open) drill.open = null;
  }}
>
  <Menu.Trigger class={menuTriggerClass} data-ranges-menu-trigger>
    <Settings2Icon size={18} aria-hidden="true" />
    <span>Ranges</span>
    <ChevronDownIcon size={18} aria-hidden="true" />
  </Menu.Trigger>
  <Portal>
    <Menu.Positioner>
      <Menu.Content class={menuContentClass}>
        {#if options}
          <MenuSubmenu
            label="Generate ranges"
            icon={WandSparklesIcon}
            current={options.mode === 'manual' && !options.isCustomRanges
              ? 'Manual steps'
              : generatedLabel}
          >
            {#if options.isCustomRanges}
              <p class="text-surface-700-300 max-w-64 px-2 py-1 text-xs">
                Choosing one replaces your custom ranges. Undo puts them back.
              </p>
            {/if}
            <!-- Automatic choices, then (set apart, as in other menus)
            rounding them, then setting the steps by hand -->
            {#each generations.filter((g) => g.value !== 'manual') as item (item.value)}
              {@render choice(item)}
            {/each}
            {#if canRound}
              <Menu.Separator />
              <Menu.OptionItem
                type="checkbox"
                value="round"
                closeOnSelect={false}
                checked={options.auto.roundIncrement}
                onCheckedChange={(checked) =>
                  generate({ roundIncrement: checked })}
                class={menuItemClass}
              >
                <DecimalsArrowLeftIcon

                  class="shrink-0"
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1">Round numbers</span>
                <MenuCheckbox checked={options.auto.roundIncrement} />
              </Menu.OptionItem>
            {/if}
            {#each generations.filter((g) => g.value === 'manual') as item (item.value)}
              <Menu.Separator />
              {@render choice(item)}
            {/each}
          </MenuSubmenu>
          {#if drill.showsMenu}
            <Menu.Separator />
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
                  <direction.icon

                    class="shrink-0"
                    aria-hidden="true"
                  />
                  <span class="min-w-0 flex-1">{direction.label}</span>
                  <CheckIcon

                    class="shrink-0 {checked ? '' : 'invisible'}"
                    aria-hidden="true"
                  />
                </Menu.OptionItem>
              {/each}
            </Menu.ItemGroup>
            <Menu.Separator />
          {/if}
          {#if drill.showsMenu}
            <Menu.OptionItem
              type="checkbox"
              value="linked"
              closeOnSelect={false}
              checked={options.linked}
              onCheckedChange={(checked) => change({ linked: checked })}
              class={menuItemClass}
            >
              <Link2Icon  class="shrink-0" aria-hidden="true" />
              <span class="flex min-w-0 flex-1 flex-col">
                <span>Linked ranges</span>
                <span class="text-surface-700-300 text-xs"
                  >Changing a range value automatically updates the next or previous one</span
                >
              </span>
              <MenuCheckbox checked={options.linked} />
            </Menu.OptionItem>
        <Menu.Separator />
          {/if}
          <MenuSubmenu
            label="Each range includes"
            icon={included?.notation ?? BracketsIcon}
            current={included?.label ?? ''}
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
                <span
                  class="w-[18px] shrink-0 text-center font-mono text-sm leading-none whitespace-nowrap"
                  aria-hidden="true">{include.notation}</span
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
          </MenuSubmenu>

        {/if}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
