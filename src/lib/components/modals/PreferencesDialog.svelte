<!-- Preferences: how the site looks, sounds, and moves. Every change applies
right away. Each choice is a set of tiles that show what it does; underneath,
they're radio buttons, so arrow keys and screen readers work as expected. -->

<script lang="ts">
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
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
    setEffect,
  } from '$lib/utils/feedback.svelte';
  import { CheckIcon, RotateCcwIcon } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';

  type Theme = typeof preferences.value.theme;

  type Option = { id: string; name: string; description: string };

  type TileGroup = {
    legend: string;
    key: keyof Theme;
    options: Option[];
    fallback: string;
    preview: Snippet<[string]>;
  };

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

  function choose(key: keyof Theme, value: string) {
    (preferences.value.theme as Record<string, string>)[key] = value;
  }

  function resetAll() {
    preferences.value.theme = { ...DEFAULT_THEME };
    preferences.value.effects = undefined;
  }

  const TEXT_PREVIEW_SIZE: Record<string, string> = {
    small: '0.95rem',
    normal: '1.2rem',
    large: '1.5rem',
  };
  const BUTTON_PREVIEW_RADIUS: Record<string, string> = {
    sharp: 'rounded-none',
    rounded: 'rounded-md',
    pill: 'rounded-full',
  };
</script>

<!-- A choice shown as tiles: a picture of each option above its name -->
{#snippet tiles({ legend, key, options, fallback, preview }: TileGroup)}
  {@const current = preferences.value.theme[key] ?? fallback}
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-2 text-sm font-semibold">{legend}</legend>
    <div class="grid grid-cols-3 gap-2">
      {#each options as option (option.id)}
        {@const selected = current === option.id}
        <label
          title={option.description}
          class={[
            'rounded-container relative flex cursor-pointer flex-col items-center justify-center gap-1 border p-2 text-center transition-colors',
            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-current',
            selected
              ? 'border-primary-500 bg-primary-500/10 border-2'
              : 'border-surface-300-700 hover:bg-surface-200-800 m-px',
          ]}
        >
          <input
            type="radio"
            class="sr-only"
            name="preferences-{key}"
            value={option.id}
            checked={selected}
            onchange={() => choose(key, option.id)}
          />
          {#if selected}
            <CheckIcon
              aria-hidden="true"
              class="text-primary-700-300 absolute top-1 right-1 size-4"
            />
          {/if}
          <span class="flex h-9 w-full items-center justify-center">
            {@render preview(option.id)}
          </span>
          <span class="text-sm leading-tight">{option.name}</span>
        </label>
      {/each}
    </div>
  </fieldset>
{/snippet}

{#snippet modePreview(id: string)}
  <span aria-hidden="true" class="[&_svg]:size-6">
    {@html THEMES.find((theme) => theme.id === id)?.icon}
  </span>
{/snippet}

{#snippet colorsPreview(id: string)}
  {@const colors = SKELETON_THEMES.find((theme) => theme.id === id)?.colors}
  {#if colors}
    <span
      aria-hidden="true"
      class="rounded-base flex h-8 w-full overflow-hidden border"
    >
      <span class="flex-auto" style="background:{colors.surface}"></span>
      <span class="flex-auto" style="background:{colors.primary}"></span>
      <span class="flex-auto" style="background:{colors.secondary}"></span>
    </span>
  {/if}
{/snippet}

{#snippet textPreview(id: string)}
  <span aria-hidden="true" style="font-size:{TEXT_PREVIEW_SIZE[id]}">Aa</span>
{/snippet}

{#snippet spacingPreview(id: string)}
  {@const Icon = SPACING.find((spacing) => spacing.id === id)?.IconComponent}
  {#if Icon}
    <Icon aria-hidden="true" class="size-6" />
  {/if}
{/snippet}

{#snippet buttonsPreview(id: string)}
  <span
    aria-hidden="true"
    class="h-5 w-10 border-2 border-current {BUTTON_PREVIEW_RADIUS[id]}"
  ></span>
{/snippet}

{#snippet headingsPreview(id: string)}
  {@const style = HEADING_STYLE.find((heading) => heading.id === id)}
  {#if style}
    <span
      aria-hidden="true"
      class="text-2xl"
      style="font-family:var(--heading-font-family);font-variation-settings:'opsz' {style.opsz}, 'wght' {style.wght}, 'SOFT' {style.SOFT}, 'WONK' {style.WONK}"
      >Aa</span
    >
  {/if}
{/snippet}

<div class="flex w-full flex-col gap-8 px-4 pt-2 pb-4 text-left">
  <section aria-labelledby="preferences-theme" class="flex flex-col gap-4">
    <h3 id="preferences-theme" class="h4">Theme</h3>
    {@render tiles({
      legend: 'Mode',
      key: 'mode',
      options: THEMES,
      fallback: 'system',
      preview: modePreview,
    })}
    {@render tiles({
      legend: 'Colors',
      key: 'id',
      options: SKELETON_THEMES,
      fallback: 'classic',
      preview: colorsPreview,
    })}
  </section>

  <section aria-labelledby="preferences-layout" class="flex flex-col gap-4">
    <h3 id="preferences-layout" class="h4">Text & Layout</h3>
    {@render tiles({
      legend: 'Text Size',
      key: 'textScale',
      options: TEXT_SCALE,
      fallback: 'normal',
      preview: textPreview,
    })}
    {@render tiles({
      legend: 'Spacing',
      key: 'spacing',
      options: SPACING,
      fallback: 'normal',
      preview: spacingPreview,
    })}
    {@render tiles({
      legend: 'Buttons',
      key: 'roundness',
      options: ROUNDNESS,
      fallback: 'pill',
      preview: buttonsPreview,
    })}
    {@render tiles({
      legend: 'Headings',
      key: 'headingStyle',
      options: HEADING_STYLE,
      fallback: 'classic',
      preview: headingsPreview,
    })}
  </section>

  <section aria-labelledby="preferences-effects" class="flex flex-col gap-4">
    <h3 id="preferences-effects" class="h4">Sound & Motion</h3>
    <div
      class="divide-surface-300-700 rounded-container border-surface-300-700 bg-surface-100 dark:bg-surface-900 flex flex-col divide-y border"
    >
      <ToggleSwitch
        bare
        label="Sounds"
        details="Soft clicks when moving colors, copying, saving, and using switches"
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
        details="Turns off decorative animations. Your device's Reduce Motion setting is always followed."
        checked={effects.motion === 'reduce'}
        onchange={(e) =>
          setEffect(
            'motion',
            (e.currentTarget as HTMLInputElement).checked ? 'reduce' : 'system',
          )}
      />
    </div>
  </section>

  <button
    type="button"
    class="btn hover:preset-tonal-surface self-center"
    onclick={resetAll}
  >
    <RotateCcwIcon />
    Reset to Defaults
  </button>
</div>
