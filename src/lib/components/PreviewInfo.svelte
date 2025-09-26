<script lang="ts">
  let { description = null, details = null, previewTitle = '' } = $props();
</script>

<div class="flex w-full flex-col items-center gap-2">
  <p class="text-sm">Touch or click the preview above to see details.</p>
  <div
    class=" preset-tonal card mx-auto flex w-fit max-w-(--breakpoint-sm) flex-col items-start gap-2 p-4 text-left"
  >
    <p class="text-2xl font-bold">{previewTitle} Layout</p>

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
</div>
