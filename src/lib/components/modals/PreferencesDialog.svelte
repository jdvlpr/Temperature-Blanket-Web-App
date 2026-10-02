<!-- Preferences: how the site looks, sounds, and moves. Every change applies
right away. Built from the site's usual settings pieces (as in the palette
image export): selects with the current choice's icon beside it, a segmented
control for light/dark, a row of color theme thumbnails (as the pattern
picker), and a card of switches. -->

<script lang="ts">
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import {
    HEADING_STYLE,
    ROUNDNESS,
    SKELETON_THEMES,
    SPACING,
    TEXT_SCALE,
    THEMES,
  } from '$lib/constants/page-constants';
  import { preferences } from '$lib/storage/preferences.svelte';
  import {
    canVibrate,
    getEffects,
    motion,
    setEffect,
  } from '$lib/utils/feedback.svelte';
  import { RotateCcwIcon } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { onMount, type Snippet } from 'svelte';

  type Theme = typeof preferences.value.theme;

  type Option = { id: string; name: string };

  const DEFAULT_THEME: Theme = {
    id: 'classic',
    mode: 'system',
    roundness: 'pill',
    spacing: 'normal',
    textScale: 'normal',
    headingStyle: 'classic',
  };

  let effects = $derived(getEffects());

  // Only offer vibration where it does something (in practice, Android phones)
  let showVibration = $state(false);
  onMount(() => {
    showVibration = canVibrate();
  });

  // Keep the chosen color theme in view in its scrolling row, e.g. when it's
  // picked from the select
  let themeRow: HTMLElement | undefined = $state();
  $effect(() => {
    preferences.value.theme.id;
    themeRow?.querySelector('[aria-pressed="true"]')?.scrollIntoView({
      behavior: motion.reduced ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  });

  function choose(key: keyof Theme, value: string) {
    (preferences.value.theme as Record<string, string>)[key] = value;
  }

  function resetAll() {
    preferences.value.theme = { ...DEFAULT_THEME };
    preferences.value.effects = undefined;
  }

  const BUTTON_ICON_RADIUS: Record<string, string> = {
    sharp: 'rounded-none',
    rounded: 'rounded-[3px]',
    pill: 'rounded-full',
  };
</script>

<!-- A setting with a few choices, as the site's other selects, with the
current choice's icon beside it -->
{#snippet choiceSelect({
  label,
  key,
  options,
  fallback,
  icon,
}: {
  label: string;
  key: keyof Theme;
  options: Option[];
  fallback: string;
  icon: Snippet<[string]>;
})}
  {@const current = preferences.value.theme[key] ?? fallback}
  <label class="label">
    <span class="label-text">{label}</span>
    <div class="relative flex items-center">
      <span
        class="pointer-events-none absolute left-2 flex size-6 items-center justify-center"
        aria-hidden="true"
      >
        {@render icon(current)}
      </span>
      <select
        class="select truncate pl-10"
        value={current}
        onchange={(e) => choose(key, e.currentTarget.value)}
      >
        {#each options as option (option.id)}
          <option value={option.id}>{option.name}</option>
        {/each}
      </select>
    </div>
  </label>
{/snippet}

{#snippet colorsIcon(id: string)}
  <!-- data-theme scopes the theme's own colors here, so these follow light/dark -->
  <span
    data-theme={id}
    class="border-surface-300-700 flex h-4 w-6 overflow-hidden rounded-[3px] border"
  >
    <span class="bg-surface-50-950 flex-auto"></span>
    <span class="bg-primary-500 flex-auto"></span>
    <span class="bg-secondary-500 flex-auto"></span>
  </span>
{/snippet}

{#snippet textSizeIcon(id: string)}
  {@const Icon = TEXT_SCALE.find((option) => option.id === id)?.IconComponent}
  {#if Icon}<Icon class="size-5" />{/if}
{/snippet}

{#snippet spacingIcon(id: string)}
  {@const Icon = SPACING.find((option) => option.id === id)?.IconComponent}
  {#if Icon}<Icon class="size-5" />{/if}
{/snippet}

{#snippet buttonsIcon(id: string)}
  <span class="h-3.5 w-6 border-2 border-current {BUTTON_ICON_RADIUS[id]}"
  ></span>
{/snippet}

{#snippet headingsIcon(id: string)}
  {@const style = HEADING_STYLE.find((heading) => heading.id === id)}
  {#if style}
    <span
      class="text-lg leading-none"
      style="font-family:var(--heading-font-family);font-variation-settings:'opsz' {style.opsz}, 'wght' {style.wght}, 'SOFT' {style.SOFT}, 'WONK' {style.WONK}"
      >Aa</span
    >
  {/if}
{/snippet}

<div class="flex w-full flex-col gap-4 px-4 pt-2 pb-4 text-left">
  <div class="flex flex-col gap-1">
    <SegmentedControl
      value={preferences.value.theme.mode ?? 'system'}
      onValueChange={(e) => {
        if (e.value) choose('mode', e.value);
      }}
    >
      <SegmentedControl.Label class="label-text">Mode</SegmentedControl.Label>
      <SegmentedControl.Control
        class="bg-surface-100 dark:bg-surface-900 w-full"
      >
        <SegmentedControl.Indicator />
        {#each THEMES as mode (mode.id)}
          <SegmentedControl.Item value={mode.id} class="flex-1">
            <SegmentedControl.ItemText
              class="flex items-center gap-1 [&_svg]:size-4 [&_svg]:shrink-0"
            >
              {@html mode.icon}
              {mode.name}
            </SegmentedControl.ItemText>
            <SegmentedControl.ItemHiddenInput />
          </SegmentedControl.Item>
        {/each}
      </SegmentedControl.Control>
    </SegmentedControl>
  </div>

  <div class="flex flex-col gap-1">
    {@render choiceSelect({
      label: 'Colors',
      key: 'id',
      options: SKELETON_THEMES,
      fallback: 'classic',
      icon: colorsIcon,
    })}

    <!-- Every color theme at a glance, as the pattern picker's thumbnails: a
    tiny page in its background, button, and accent colors. data-theme scopes
    each theme's own colors, so they follow light/dark like the site does. One
    row that scrolls when it doesn't fit -->
    <div
      role="group"
      aria-label="Color themes"
      bind:this={themeRow}
      class="mx-auto flex w-fit max-w-full snap-x gap-1 overflow-x-auto pb-2"
    >
      {#each SKELETON_THEMES as theme (theme.id)}
        {@const selected =
          (preferences.value.theme.id ?? 'classic') === theme.id}
        <button
          type="button"
          class={[
            'flex shrink-0 snap-center flex-col items-center gap-1 rounded p-2 text-xs whitespace-nowrap',
            selected
              ? 'bg-primary-200 dark:bg-primary-800 shadow-sm'
              : 'hover:bg-surface-100-900',
          ]}
          aria-pressed={selected}
          title="{theme.name} Colors"
          onclick={() => choose('id', theme.id)}
        >
          <span
            data-theme={theme.id}
            class="bg-surface-50-950 border-surface-300-700 flex h-8 w-12 flex-col justify-between rounded-[3px] border p-1"
            aria-hidden="true"
          >
            <span class="bg-secondary-500 h-1 w-7 rounded-full"></span>
            <span class="bg-primary-500 h-2.5 w-5 self-end rounded-full"></span>
          </span>
          {theme.name}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    {@render choiceSelect({
      label: 'Text Size',
      key: 'textScale',
      options: TEXT_SCALE,
      fallback: 'normal',
      icon: textSizeIcon,
    })}
    {@render choiceSelect({
      label: 'Spacing',
      key: 'spacing',
      options: SPACING,
      fallback: 'normal',
      icon: spacingIcon,
    })}
    {@render choiceSelect({
      label: 'Buttons',
      key: 'roundness',
      options: ROUNDNESS,
      fallback: 'pill',
      icon: buttonsIcon,
    })}
    {@render choiceSelect({
      label: 'Headings',
      key: 'headingStyle',
      options: HEADING_STYLE,
      fallback: 'classic',
      icon: headingsIcon,
    })}
  </div>

  <div
    role="group"
    aria-labelledby="preferences-sound-motion"
    class="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y border border-gray-300 dark:border-gray-700"
  >
    <span id="preferences-sound-motion" class="label-text px-4 py-2.5"
      >Sound & Motion</span
    >
    <ToggleSwitch
      bare
      label="Sounds"
      details="Soft clicks as you move colors, copy, and save"
      checked={effects.sound}
      onchange={(e) =>
        setEffect('sound', (e.currentTarget as HTMLInputElement).checked)}
    />
    {#if showVibration}
      <ToggleSwitch
        bare
        label="Vibration"
        details="A light tap for the same actions"
        checked={effects.haptics}
        onchange={(e) =>
          setEffect('haptics', (e.currentTarget as HTMLInputElement).checked)}
      />
    {/if}
    <ToggleSwitch
      bare
      label="Reduce Motion"
      details="Fewer animations"
      checked={effects.motion === 'reduce'}
      onchange={(e) =>
        setEffect(
          'motion',
          (e.currentTarget as HTMLInputElement).checked ? 'reduce' : 'system',
        )}
    />
  </div>
</div>

<StickyPart position="bottom">
  <div
    class="bg-surface-50 dark:bg-surface-950 flex flex-wrap items-center justify-center gap-2 px-2 py-2 sm:px-4"
  >
    <button class="btn hover:preset-tonal-surface" onclick={resetAll}>
      <RotateCcwIcon />
      Reset to Defaults
    </button>
  </div>
</StickyPart>
