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
  import { preferences } from '$lib/storage/preferences.svelte';
  import {
    ChevronDownIcon,
    RotateCcwIcon,
    Settings2Icon,
  } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="flex flex-col gap-4 w-full pb-8 px-2 sm:px-4 text-left">
  <p class="h2 text-gradient">Appearance</p>
  <!-- Appearance (Light / Dark / System) -->
  <div class="flex flex-col gap-1">
    <p class="text-xs font-semibold uppercase tracking-wider opacity-60">
      Mode<span class="sm:hidden">: {preferences.value.theme.mode}</span>
    </p>
    <SegmentedControl
      value={preferences.value.theme.mode}
      onValueChange={(e) => {
        if (preferences.value?.theme.mode) {
          preferences.value.theme.mode = e.value;
        }
      }}
    >
      <SegmentedControl.Control class="bg-surface-100 dark:bg-surface-900 card">
        <SegmentedControl.Indicator />
        {#each THEMES as { name, id, icon, description }}
          <SegmentedControl.Item value={id} title={description}>
            <SegmentedControl.ItemText
              class="flex items-center justify-center gap-1"
            >
              {@html icon}
              <span class="sm:inline hidden">{name}</span>
            </SegmentedControl.ItemText>
            <SegmentedControl.ItemHiddenInput />
          </SegmentedControl.Item>
        {/each}
      </SegmentedControl.Control>
    </SegmentedControl>
  </div>

  <!-- Theme -->
  <div class="flex flex-col gap-1">
    <p class="text-xs font-semibold uppercase tracking-wider opacity-60">
      Theme
    </p>
    <div class="grid grid-cols-3 items-center gap-4 p-1">
      {#each SKELETON_THEMES as { name, id, colors, description }}
        <button
          onclick={() => {
            preferences.value.theme.id = id;
          }}
          class="btn flex flex-col w-full items-center justify-start gap-0 p-0"
          title={description}
        >
          <div
            class={[
              'flex h-10 w-full overflow-hidden rounded-base border',
              id === preferences.value.theme.id && 'ring-2 ring-tertiary-500',
            ]}
          >
            <div class="flex-auto" style="background:{colors.surface}"></div>
            <div class="flex-auto" style="background:{colors.primary}"></div>
            <div class="flex-auto" style="background:{colors.secondary}"></div>
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
    <!-- Roundness -->
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold uppercase tracking-wider opacity-60">
        Buttons<span class="sm:hidden"
          >: {preferences.value.theme.roundness}</span
        >
      </p>

      <SegmentedControl
        value={preferences.value.theme.roundness ?? 'pill'}
        onValueChange={(e) => {
          preferences.value.theme.roundness = e.value;
        }}
      >
        <SegmentedControl.Control
          class="bg-surface-100 dark:bg-surface-900 card"
        >
          <SegmentedControl.Indicator />
          {#each ROUNDNESS as { name, id, description }}
            <SegmentedControl.Item value={id} title={description}>
              <SegmentedControl.ItemText
                class="flex items-center justify-center gap-1"
              >
                {#if id === 'sharp'}
                  <div
                    class="border-2 border-[currentColor] w-8 h-5 my-0.5 mr-0.5 rounded-none"
                  ></div>
                {:else if id === 'rounded'}
                  <div
                    class="border-2 border-[currentColor] w-8 h-5 my-0.5 mr-0.5 rounded-md"
                  ></div>
                {:else if id === 'pill'}
                  <div
                    class="border-2 border-[currentColor] w-8 h-5 my-0.5 mr-0.5 rounded-full"
                  ></div>
                {/if}
                <span class="sm:inline hidden">{name}</span>
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>
          {/each}
        </SegmentedControl.Control>
      </SegmentedControl>
    </div>

    <!-- Heading Style -->
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold uppercase tracking-wider opacity-60">
        Heading Style<span class="sm:hidden"
          >: {preferences.value.theme.headingStyle}</span
        >
      </p>
      <SegmentedControl
        value={preferences.value.theme.headingStyle ?? 'classic'}
        onValueChange={(e) => {
          preferences.value.theme.headingStyle = e.value;
        }}
      >
        <SegmentedControl.Control
          class="bg-surface-100 dark:bg-surface-900 card"
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
      <p class="text-xs font-semibold uppercase tracking-wider opacity-60">
        Text Size<span class="sm:hidden"
          >: {preferences.value.theme.textScale}</span
        >
      </p>
      <SegmentedControl
        value={preferences.value.theme.textScale ?? 'normal'}
        onValueChange={(e) => {
          preferences.value.theme.textScale = e.value;
        }}
      >
        <SegmentedControl.Control
          class="bg-surface-100 dark:bg-surface-900 card"
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
                <span class="sm:inline hidden">{name}</span>
              </SegmentedControl.ItemText>
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>
          {/each}
        </SegmentedControl.Control>
      </SegmentedControl>
    </div>

    <!-- Spacing -->
    <div class="flex flex-col gap-1">
      <p class="text-xs font-semibold uppercase tracking-wider opacity-60">
        Spacing<span class="sm:hidden">: {preferences.value.theme.spacing}</span
        >
      </p>
      <SegmentedControl
        value={preferences.value.theme.spacing ?? 'normal'}
        onValueChange={(e) => {
          preferences.value.theme.spacing = e.value;
        }}
      >
        <SegmentedControl.Control
          class="bg-surface-100 dark:bg-surface-900 card"
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
                <span class="sm:inline hidden">{name}</span>
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
      Reset All
    </button>
  {/if}
</div>
