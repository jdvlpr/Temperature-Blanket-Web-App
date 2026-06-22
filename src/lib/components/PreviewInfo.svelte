<script lang="ts">
  import { previews } from "$lib/state/preview-state.svelte";
  import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from "@lucide/svelte";
  import { slide } from "svelte/transition";

  let { description = null, details = null, previewTitle = '' } = $props();

  function toggleDetails() {
    previews.showDetails = !previews.showDetails;
  }
</script>

  <div
    class="mx-auto flex w-full flex-col items-center gap-2 text-left"
  >
      <button class="btn hover:preset-tonal-surface " onclick={toggleDetails}>
    <InfoIcon/>
      {#if previews.showDetails}
      Information
      <ChevronUpIcon/>
      {:else}
      Information
      <ChevronDownIcon/>
      {/if}
    </button>
      

    {#if previews.showDetails}
    <div class="flex flex-col gap-2" transition:slide>
      {#if description}
        <p class="">
          {@render description()}
        </p>
      {/if}
      
      {#if details}
      <div class="">
        <p class="">
          {@render details()}
        </p>
      </div>
      {/if}
      </div>
    {/if}
    
  </div>
