<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
  import Globe from '$lib/components/visualizations/Globe.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import AppLogo from '$lib/components/AppLogo.svelte';
  
  let globeData = $state<any[]>([]);
  let updatedAt = $state('');
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      // Fetch the data from the new REST API endpoint
      const res = await fetch(`${PUBLIC_WORDPRESS_BASE_URL}/wp-json/tbgalleryapi/v1/globe-data`, {cache: 'no-store'});
      if (!res.ok) throw new Error('Failed to load globe data');
      const json = await res.json();
      globeData = json.data || [];
      updatedAt = json.updated_at || '';
      
    } catch (e) {
      console.error(e);
      error = 'Could not load visualization data. Please try again later.';
    } finally {
      loading = false;
    }
  });
</script>
<AppShell pageName="Global Map">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <div class="mx-auto space-y-4 w-full">
      <div class="flex flex-col items-center justify-center">
        {#if loading}
            <div class=" bg-surface-950 w-full flex flex-col items-center justify-center  h-[70dvh] sm:h-[75dvh] lg:rounded-container overflow-hidden rounded-none lg:shadow-md">
                <div class="size-93 rounded-full bg-surface-500 mb-4 animate-pulse"></div>
                <p class="text-surface-400">Loading World View...</p>
            </div>
        {:else if error}
            <div class="text-error-500 text-center p-8 bg-error-900/10 rounded-lg border border-error-500/30">
                <p class="mb-4">{error}</p>
                <button onclick={() => window.location.reload()} class="btn variant-filled-error">
                    Retry
                </button>
            </div>
        {:else}
              <Globe data={globeData} {updatedAt} />
        {/if}
      </div>
    </div>
  {/snippet}
</AppShell>