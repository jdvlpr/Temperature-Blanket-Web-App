<!-- Suggests making a yarn the default once it's been used a few times, in
place of an always-there toggle. The default is otherwise set in Preferences. -->

<script lang="ts">
  import { defaultYarn } from '$lib/state/page-state.svelte';
  import { yarnKey, yarnUses } from '$lib/storage/yarn-uses.svelte';
  import { stringToBrandAndYarnDetails } from '$lib/utils/yarn-utils';
  import { CheckIcon, XIcon } from '@lucide/svelte';

  let {
    selectedBrandId,
    selectedYarnId,
    class: className = '',
  }: {
    selectedBrandId?: string;
    selectedYarnId?: string;
    /** For when it's showing */
    class?: string;
  } = $props();

  let key = $derived(yarnKey(selectedBrandId, selectedYarnId));
  // The yarn just made the default here, to confirm it
  let madeDefault = $state('');
  let region: HTMLDivElement | undefined = $state();

  let showing = $derived(
    key && madeDefault === key ? 'done' : yarnUses.suggests(key) ? 'ask' : null,
  );

  function name(key: string) {
    const { brandName, yarnName } = stringToBrandAndYarnDetails(key);
    return brandName && yarnName ? `${brandName} ${yarnName}` : '';
  }

  let current = $derived(defaultYarn.value ? name(defaultYarn.value) : '');

  // The pressed button goes, so focus stays here rather than leaving the
  // dialog
  function answer(make: boolean) {
    if (make) {
      defaultYarn.value = key;
      madeDefault = key;
    } else yarnUses.decline(key);
    region?.focus();
  }
</script>

<!-- Always there so it's announced as it fills; out of the layout while
empty, so it leaves no gap -->
<div
  bind:this={region}
  tabindex="-1"
  class={showing ? ['w-full outline-none', className] : 'sr-only'}
  role="status"
>
  {#if showing === 'ask'}
    <div
      class="bg-surface-100 dark:bg-surface-900 rounded-container flex flex-col gap-3 border border-gray-300 p-3 text-left dark:border-gray-700"
    >
      <p class="text-sm">
        You often use <strong>{name(key)}</strong>.
        {#if current}
          Make it your default yarn instead of {current}?
        {:else}
          Make it your default yarn, so it's chosen first?
        {/if}
      </p>
      <!-- Full width on phones, sharing a row when they fit -->
      <div class="flex flex-wrap gap-2 sm:justify-end max-sm:[&>button]:flex-1">
        <button
          type="button"
          class="btn preset-filled-surface-50-950"
          onclick={() => answer(false)}
        >
          <XIcon />
          Not Now
        </button>
        <button
          type="button"
          class="btn preset-filled-primary-500"
          onclick={() => answer(true)}
        >
          <CheckIcon />
          Make Default
        </button>
      </div>
    </div>
  {:else if showing === 'done'}
    <p
      class="bg-surface-100 dark:bg-surface-900 rounded-container flex items-center gap-2 border border-gray-300 p-3 text-left text-sm dark:border-gray-700"
    >
      <CheckIcon class="shrink-0" aria-hidden="true" />
      <span
        ><strong>{name(key)}</strong> is your default yarn. Change it anytime in Preferences.</span
      >
    </p>
  {/if}
</div>
