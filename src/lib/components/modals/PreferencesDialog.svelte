<!-- Preferences: how the site looks, sounds, and moves, and the default yarn.
Every change applies right away and is kept in this browser; signed in, the
colors, mode, buttons, headings, and default yarn also follow the account (see
$lib/sync/preferences). Built from the site's usual settings pieces (as in the
palette image export): selects with the current choice's icon beside it, a
accordion sections (as the site navigation), each holding a card, for appearance
(with the light/dark segmented control), yarn, and sound & motion, rows of thumbnails for colors and headings
(as the pattern picker), the usual yarn picker, and a card of switches. -->

<script lang="ts">
  import { account } from '$lib/accounts/summary.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SegmentsScroller from '$lib/components/SegmentsScroller.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import {
    HEADING_STYLE,
    ROUNDNESS,
    SKELETON_THEMES,
    SPACING,
    TEXT_SCALE,
    THEMES,
  } from '$lib/constants/page-constants';
  import { defaultYarn } from '$lib/state/page-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import {
    canVibrate,
    getEffects,
    motion,
    setEffect,
  } from '$lib/utils/feedback.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { ChevronDownIcon, RotateCcwIcon } from '@lucide/svelte';
  import { Accordion, SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { onMount, type Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

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

  // Keeps the chosen thumbnail in view in its scrolling row, e.g. when it's
  // picked from the select
  function keepInView(selected: boolean): Attachment<HTMLElement> {
    return (node) => {
      if (!selected) return;
      node.scrollIntoView({
        behavior: motion.reduced ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    };
  }

  function choose(key: keyof Theme, value: string) {
    (preferences.value.theme as Record<string, string>)[key] = value;
  }

  function resetAll() {
    preferences.value.theme = { ...DEFAULT_THEME };
    preferences.value.effects = undefined;
    defaultYarn.value = '';
    // Shows the cleared yarn picker
    yarnPickerKey++;
  }

  let yarnPickerKey = $state(0);

  // Appearance starts open; any section can be opened or closed
  let openSections = $state(['appearance']);

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

<!-- A setting whose choices are easier seen than named: every choice at a
glance, as the pattern picker's thumbnails, in one row that scrolls when it
doesn't fit -->
{#snippet choiceRow({
  label,
  key,
  options,
  fallback,
  thumb,
}: {
  label: string;
  key: keyof Theme;
  options: Option[];
  fallback: string;
  thumb: Snippet<[string]>;
})}
  {@const current = preferences.value.theme[key] ?? fallback}
  {@const labelId = `preferences-${key}`}
  <div role="group" aria-labelledby={labelId} class="flex flex-col gap-1">
    <span id={labelId} class="label-text">{label}</span>
    <div class="flex max-w-full snap-x gap-1 overflow-x-auto pb-2">
      {#each options as option (option.id)}
        {@const selected = current === option.id}
        <button
          type="button"
          class={[
            'flex shrink-0 snap-center flex-col items-center gap-1 rounded p-2 text-xs whitespace-nowrap',
            selected
              ? 'bg-primary-200 dark:bg-primary-800 shadow-sm'
              : 'hover:bg-surface-200-800',
          ]}
          aria-pressed={selected}
          onclick={() => choose(key, option.id)}
          {@attach keepInView(selected)}
        >
          <span aria-hidden="true">{@render thumb(option.id)}</span>
          {option.name}
        </button>
      {/each}
    </div>
  </div>
{/snippet}

<!-- A tiny page in the theme's background, button, and accent colors.
data-theme scopes each theme's own colors, so they follow light/dark like the
site does -->
{#snippet colorsThumb(id: string)}
  <span
    data-theme={id}
    class="bg-surface-50-950 border-surface-300-700 flex h-8 w-12 flex-col justify-between rounded-[3px] border p-1"
  >
    <span class="bg-secondary-500 h-1 w-7 rounded-full"></span>
    <span class="bg-primary-500 h-2.5 w-5 self-end rounded-full"></span>
  </span>
{/snippet}

{#snippet headingsThumb(id: string)}
  {@const style = HEADING_STYLE.find((heading) => heading.id === id)}
  {#if style}
    <span
      class="flex h-8 w-12 items-center justify-center text-3xl leading-none"
      style="font-family:var(--heading-font-family);font-variation-settings:'opsz' {style.opsz}, 'wght' {style.wght}, 'SOFT' {style.SOFT}, 'WONK' {style.WONK}"
      >Aa</span
    >
  {/if}
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

{#snippet indicator()}
  <Accordion.ItemIndicator>
    <ChevronDownIcon
      class="h-5 w-5 transition group-data-[state=open]/section:rotate-180"
    />
  </Accordion.ItemIndicator>
{/snippet}

<!-- A set width, so the dialog doesn't shrink as sections close -->
<div class="flex w-full flex-col gap-4 px-4 pt-2 pb-4 text-left sm:w-xl">
  <Accordion
    value={openSections}
    onValueChange={(e) => {
      openSections = e.value;
    }}
    collapsible
    multiple
    class="flex flex-col gap-4"
  >
    <Accordion.Item
      value="appearance"
      class="group/section flex flex-col gap-2"
    >
      <h3>
        <Accordion.ItemTrigger
          class="flex w-full items-center justify-between py-1 text-base font-bold"
        >
          Appearance
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent>
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} transition:safeSlide>
              <div
                class="bg-surface-100 dark:bg-surface-900 rounded-container flex flex-col gap-4 border border-gray-300 p-4 dark:border-gray-700"
              >
                <SegmentsScroller collapse>
                  {#snippet children(iconsOnly)}
                    <SegmentedControl
                      value={preferences.value.theme.mode ?? 'system'}
                      onValueChange={(e) => {
                        if (e.value) choose('mode', e.value);
                      }}
                    >
                      <!-- With only icons showing, the label names the choice, as the
                    old theme switcher did: "Mode: Light" -->
                      <SegmentedControl.Label class="label-text"
                        >Mode{#if iconsOnly}<span aria-hidden="true"
                            >: {THEMES.find(
                              (mode) =>
                                mode.id ===
                                (preferences.value.theme.mode ?? 'system'),
                            )?.name}</span
                          >{/if}</SegmentedControl.Label
                      >
                      <!-- flex-row! keeps the options side by side: Skeleton stacks them
                    under any vertical group, and the accordion is one -->
                      <SegmentedControl.Control
                        class="bg-surface-50-950 w-full min-w-max flex-row!"
                      >
                        <SegmentedControl.Indicator />
                        {#each THEMES as mode (mode.id)}
                          <SegmentedControl.Item
                            value={mode.id}
                            class="flex-1"
                            title={iconsOnly ? mode.name : undefined}
                          >
                            <SegmentedControl.ItemText
                              class="flex items-center gap-1 [&_svg]:shrink-0"
                            >
                              {@html mode.icon}
                              <span class={{ 'sr-only': iconsOnly }}
                                >{mode.name}</span
                              >
                            </SegmentedControl.ItemText>
                            <SegmentedControl.ItemHiddenInput />
                          </SegmentedControl.Item>
                        {/each}
                      </SegmentedControl.Control>
                    </SegmentedControl>
                  {/snippet}
                </SegmentsScroller>

                {@render choiceRow({
                  label: 'Colors',
                  key: 'id',
                  options: SKELETON_THEMES,
                  fallback: 'classic',
                  thumb: colorsThumb,
                })}

                {@render choiceRow({
                  label: 'Headings',
                  key: 'headingStyle',
                  options: HEADING_STYLE,
                  fallback: 'classic',
                  thumb: headingsThumb,
                })}

                <div class="grid gap-4 sm:grid-cols-3">
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
                </div>
              </div>
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
    <Accordion.Item value="yarn" class="group/section flex flex-col gap-2">
      <h3>
        <Accordion.ItemTrigger
          class="flex w-full items-center justify-between py-1 text-base font-bold"
        >
          Yarn
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent>
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} transition:safeSlide>
              <div
                class="bg-surface-100 dark:bg-surface-900 rounded-container flex flex-col border border-gray-300 p-4 dark:border-gray-700"
              >
                <!-- The yarn picker fills in the default yarn itself. A yarn
                sets it, clearing the picker removes it, and a brand alone
                leaves it as it was -->
                <div role="group" aria-labelledby="preferences-default-yarn">
                  <span id="preferences-default-yarn" class="label-text"
                    >Default Yarn</span
                  >
                  <p class="mb-1 text-sm opacity-70">
                    Chosen first where no yarn is, like for colors with none
                    assigned
                  </p>
                  {#key yarnPickerKey}
                    <SelectYarn
                      onselectautocomplete={({
                        selectedBrandId,
                        selectedYarnId,
                      }) => {
                        if (selectedBrandId && selectedYarnId)
                          defaultYarn.value = `${selectedBrandId}-${selectedYarnId}`;
                        else if (!selectedBrandId && !selectedYarnId)
                          defaultYarn.value = '';
                      }}
                    />
                  {/key}
                </div>
              </div>
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
    <Accordion.Item
      value="sound-motion"
      class="group/section flex flex-col gap-2"
    >
      <h3>
        <Accordion.ItemTrigger
          class="flex w-full items-center justify-between py-1 text-base font-bold"
        >
          Sound & Motion
          {@render indicator()}
        </Accordion.ItemTrigger>
      </h3>
      <Accordion.ItemContent>
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} transition:safeSlide>
              <div
                class="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y border border-gray-300 dark:border-gray-700"
              >
                <ToggleSwitch
                  bare
                  label="Sounds"
                  details="Soft clicks as you move colors, copy, and save"
                  checked={effects.sound}
                  onchange={(e) =>
                    setEffect(
                      'sound',
                      (e.currentTarget as HTMLInputElement).checked,
                    )}
                />
                {#if showVibration}
                  <ToggleSwitch
                    bare
                    label="Vibration"
                    details="A light tap for the same actions"
                    checked={effects.haptics}
                    onchange={(e) =>
                      setEffect(
                        'haptics',
                        (e.currentTarget as HTMLInputElement).checked,
                      )}
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
                      (e.currentTarget as HTMLInputElement).checked
                        ? 'reduce'
                        : 'system',
                    )}
                />
              </div>
            </div>
          {/if}
        {/snippet}
      </Accordion.ItemContent>
    </Accordion.Item>
  </Accordion>
</div>

<StickyPart position="bottom">
  <div
    class="bg-surface-50 dark:bg-surface-950 flex flex-wrap items-center justify-center gap-2 px-2 py-2 sm:px-4"
  >
    {#if account.summary}
      <p class="w-full text-center text-sm opacity-70">
        Colors, mode, buttons, headings, and default yarn are saved to your
        account
      </p>
    {/if}
    <button class="btn hover:preset-tonal-surface" onclick={resetAll}>
      <RotateCcwIcon />
      Reset to Defaults
    </button>
  </div>
</StickyPart>
