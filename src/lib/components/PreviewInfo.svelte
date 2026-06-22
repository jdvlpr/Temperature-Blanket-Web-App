<script lang="ts">
  import { previews } from '$lib/state/preview-state.svelte';
  import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '@lucide/svelte';
  import { slide } from 'svelte/transition';

  let { description = null, details = null, previewTitle = '' } = $props();

  function toggleDetails() {
    previews.showInformation = !previews.showInformation;
  }
</script>

<div class="mx-auto flex w-full flex-col items-center gap-2 text-left">
  <button class="btn hover:preset-tonal-surface" onclick={toggleDetails}>
    <InfoIcon />
    {#if previews.showInformation}
      Information
      <ChevronUpIcon />
    {:else}
      Information
      <ChevronDownIcon />
    {/if}
  </button>

  {#if previews.showInformation}
    <div class="flex flex-col gap-2 max-w-screen-md" transition:slide>
      {#if description}
        <div class="">
          <p class="text-2xl font-bold">About</p>
          <p class="font-semibold">{previewTitle} Layout</p>
          {@render description()}
        </div>
      {/if}

      {#if details}
        <div class="">
          <p class="text-2xl font-bold">In This Preview</p>
          {@render details()}
        </div>
      {/if}

      <p class="text-xs mt-2">
        Touch or click the preview below to see weather details.
      </p>
    </div>
  {/if}
</div>
