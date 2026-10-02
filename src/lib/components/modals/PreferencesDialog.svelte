<script module>
  let isExpanded = $state(false);
</script>

<script lang="ts">
  import {
    HEADING_STYLE,
    ROUNDNESS,
    SKELETON_THEMES,
    SPACING,
    TEXT_SCALE,
    THEMES,
  } from '$lib/constants/page-constants';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import {
    canVibrate,
    getEffects,
    setEffect,
  } from '$lib/utils/feedback.svelte';
  import {
    ChevronDownIcon,
    RotateCcwIcon,
    Settings2Icon,
  } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';

  let effects = $derived(getEffects());

  // Only offer vibration where it does something (in practice, Android phones)
  let showVibration = $state(false);
  onMount(() => {
    showVibration = canVibrate();
  });
</script>

<div class="flex w-full flex-col gap-8 px-4 pt-2 pb-4 text-left">
  <section aria-labelledby="preferences-appearance" class="flex flex-col gap-4">
    <h3 id="preferences-appearance" class="h4">Appearance</h3>
    <!-- Mode (Light / Dark / System) -->
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold tracking-wider uppercase opacity-60">
        Mode<span class="sm:hidden">: {preferences.value.theme.mode}</span>
      </p>
      <SegmentedControl
        value={(preferences.value.theme.mode ?? 'system') as
          'light' | 'dark' | 'system'}
        onValueChange={(e) => {
          if (preferences.value?.theme.mode) {
            preferences.value.theme.mode = e.value as
              'light' | 'dark' | 'system';
          }
        }}
      >
        <SegmentedControl.Control class="bg-surface-100 dark:bg-surface-900">
          <SegmentedControl.Indicator />
          {#each THEMES as { name, id, icon, description }}
            <SegmentedControl.Item value={id} title={description}>
              <SegmentedControl.ItemText
                class="flex items-center justify-center gap-1"
              >
                {@html icon}
                <span class="hidden sm:inline">{name}</span>
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>
          {/each}
        </SegmentedControl.Control>
      </SegmentedControl>
    </div>

    <!-- Theme -->
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold tracking-wider uppercase opacity-60">
        Theme
      </p>
      <div class="grid grid-cols-3 items-center gap-4 p-1">
        {#each SKELETON_THEMES as { name, id, colors, description }}
          <button
            onclick={() => {
              preferences.value.theme.id = id;
            }}
            class="btn flex w-full flex-col items-center justify-start gap-0 p-0"
            title={description}
            aria-label="{name} theme"
            aria-pressed={id === preferences.value.theme.id}
          >
            <div
              class={[
                'rounded-base flex h-10 w-full overflow-hidden border',
                id === preferences.value.theme.id && 'ring-tertiary-500 ring-2',
              ]}
            >
              <div class="flex-auto" style="background:{colors.surface}"></div>
              <div class="flex-auto" style="background:{colors.primary}"></div>
              <div
                class="flex-auto"
                style="background:{colors.secondary}"
              ></div>
            </div>
            <!-- <span class="text-sm opacity-70">{name}</span> -->
          </button>
        {/each}
      </div>
    </div>

    <button
      class="btn hover:preset-tonal-surface w-fit"
      onclick={() => (isExpanded = !isExpanded)}
    >
      <Settings2Icon />
      Customize
      <ChevronDownIcon class={['transition', isExpanded && 'rotate-180']} />
    </button>

    {#if isExpanded}
      <div
        class="rounded-container border-surface-300-700 flex flex-col gap-4 border p-4"
      >
        <!-- Roundness -->
        <div class="flex flex-col gap-1">
          <p class="text-xs font-semibold tracking-wider uppercase opacity-60">
            Buttons<span class="sm:hidden"
              >: {preferences.value.theme.roundness}</span
            >
          </p>

          <SegmentedControl
            value={preferences.value.theme.roundness ?? 'pill'}
            onValueChange={(e) => {
              preferences.value.theme.roundness = e.value as
                'sharp' | 'rounded' | 'pill' | undefined;
            }}
          >
            <SegmentedControl.Control
              class="bg-surface-100 dark:bg-surface-900"
            >
              <SegmentedControl.Indicator />
              {#each ROUNDNESS as { name, id, description }}
                <SegmentedControl.Item value={id} title={description}>
                  <SegmentedControl.ItemText
                    class="flex items-center justify-center gap-1"
                  >
                    {#if id === 'sharp'}
                      <div
                        class="my-0.5 mr-0.5 h-5 w-8 rounded-none border-2 border-[currentColor]"
                      ></div>
                    {:else if id === 'rounded'}
                      <div
                        class="my-0.5 mr-0.5 h-5 w-8 rounded-md border-2 border-[currentColor]"
                      ></div>
                    {:else if id === 'pill'}
                      <div
                        class="my-0.5 mr-0.5 h-5 w-8 rounded-full border-2 border-[currentColor]"
                      ></div>
                    {/if}
                    <span class="hidden sm:inline">{name}</span>
                  </SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              {/each}
            </SegmentedControl.Control>
          </SegmentedControl>
        </div>

        <!-- Heading Style -->
        <div class="flex flex-col gap-1">
          <p class="text-xs font-semibold tracking-wider uppercase opacity-60">
            Heading Style<span class="sm:hidden"
              >: {preferences.value.theme.headingStyle}</span
            >
          </p>
          <SegmentedControl
            value={preferences.value.theme.headingStyle ?? 'classic'}
            onValueChange={(e) => {
              preferences.value.theme.headingStyle = e.value as
                'classic' | 'playful' | 'refined' | undefined;
            }}
          >
            <SegmentedControl.Control
              class="bg-surface-100 dark:bg-surface-900"
            >
              <SegmentedControl.Indicator />
              {#each HEADING_STYLE as { name, id, description, opsz, wght, SOFT, WONK }}
                <SegmentedControl.Item value={id} title={description}>
                  <SegmentedControl.ItemText
                    class="flex items-center justify-center gap-1"
                  >
                    <span
                      class=""
                      style="font-family:var(--heading-font-family);font-variation-settings:'opsz' {opsz},'wght' {wght},'SOFT' {SOFT},'WONK' {WONK};"
                      >Abcd</span
                    >
                  </SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              {/each}
            </SegmentedControl.Control>
          </SegmentedControl>
        </div>

        <!-- Text Size -->
        <div class="flex flex-col gap-1">
          <p class="text-xs font-semibold tracking-wider uppercase opacity-60">
            Text Size<span class="sm:hidden"
              >: {preferences.value.theme.textScale}</span
            >
          </p>
          <SegmentedControl
            value={preferences.value.theme.textScale ?? 'normal'}
            onValueChange={(e) => {
              preferences.value.theme.textScale = e.value as
                'normal' | 'small' | 'large' | undefined;
            }}
          >
            <SegmentedControl.Control
              class="bg-surface-100 dark:bg-surface-900"
            >
              <SegmentedControl.Indicator />
              {#each TEXT_SCALE as { name, id, description, IconComponent }}
                <SegmentedControl.Item value={id} title={description}>
                  <SegmentedControl.ItemText
                    class="flex items-center justify-center gap-1"
                  >
                    {#if IconComponent}
                      <IconComponent />
                    {/if}
                    <span class="hidden sm:inline">{name}</span>
                  </SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              {/each}
            </SegmentedControl.Control>
          </SegmentedControl>
        </div>

        <!-- Spacing -->
        <div class="flex flex-col gap-1">
          <p class="text-xs font-semibold tracking-wider uppercase opacity-60">
            Spacing<span class="sm:hidden"
              >: {preferences.value.theme.spacing}</span
            >
          </p>
          <SegmentedControl
            value={preferences.value.theme.spacing ?? 'normal'}
            onValueChange={(e) => {
              preferences.value.theme.spacing = e.value as
                'compact' | 'normal' | 'relaxed' | undefined;
            }}
          >
            <SegmentedControl.Control
              class="bg-surface-100 dark:bg-surface-900"
            >
              <SegmentedControl.Indicator />
              {#each SPACING as { name, id, description, IconComponent }}
                <SegmentedControl.Item value={id} title={description}>
                  <SegmentedControl.ItemText
                    class="flex items-center justify-center gap-1"
                  >
                    {#if IconComponent}
                      <IconComponent />
                    {/if}
                    <span class="hidden sm:inline">{name}</span>
                  </SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              {/each}
            </SegmentedControl.Control>
          </SegmentedControl>
        </div>

        <button
          class="btn hover:preset-tonal-surface w-fit"
          onclick={() => {
            preferences.value.theme.mode = 'system';
            preferences.value.theme.id = 'classic';
            preferences.value.theme.roundness = 'pill';
            preferences.value.theme.spacing = 'normal';
            preferences.value.theme.textScale = 'normal';
            preferences.value.theme.headingStyle = 'classic';
          }}
        >
          <RotateCcwIcon />
          Reset Appearance
        </button>
      </div>
    {/if}
  </section>

  <section aria-labelledby="preferences-effects" class="flex flex-col gap-2">
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
</div>
