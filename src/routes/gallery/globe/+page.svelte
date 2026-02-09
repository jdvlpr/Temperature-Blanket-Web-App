<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
  import Globe from '$lib/components/visualizations/Globe.svelte';
  
  let globeData = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      // Fetch the data from the new REST API endpoint
      const res = await fetch(`${PUBLIC_WORDPRESS_BASE_URL}/wp-json/tbgalleryapi/v1/globe-data`, {cache: 'no-store'});
      if (!res.ok) throw new Error('Failed to load globe data');
      globeData = await res.json();
      console.log($state.snapshot(globeData));
      
    } catch (e) {
      console.error(e);
      error = 'Could not load visualization data. Please try again later.';
    } finally {
      loading = false;
    }
  });
</script>

<div class="container mx-auto p-4 space-y-4">
  <h1 class="h1 text-center font-bold">Project Heatmap</h1>
  <p class="text-center opacity-70">Visualizing where our community creates temperature blankets.</p>
  
  <div class="card p-4 bg-surface-900 rounded-xl overflow-hidden relative min-h-[600px] flex items-center justify-center border border-surface-700 shadow-2xl">
    {#if loading}
        <div class="animate-pulse flex flex-col items-center">
            <div class="h-32 w-32 rounded-full bg-surface-700 mb-4"></div>
            <p class="text-surface-400">Loading Globe Data...</p>
        </div>
    {:else if error}
        <div class="text-error-500 text-center p-8 bg-error-900/10 rounded-lg border border-error-500/30">
            <p class="mb-4">{error}</p>
            <button onclick={() => window.location.reload()} class="btn variant-filled-error">
                Retry
            </button>
        </div>
    {:else}
        <Globe data={globeData} />
    {/if}
  </div>
</div>
