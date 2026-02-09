<script lang="ts">
  import { browser } from '$app/environment';
  import { getColorsFromInput } from '$lib/utils';
  import { onDestroy, onMount } from 'svelte';
  
  // Svelte 5 Props
  let { data = [] } = $props<{ data: any[] }>();

  // Reactivity
  let selectedPoint = $state(null);
  let isAutoRotating = $state(true);
  let globeContainer: HTMLElement;
  let Globe: any;
  let globe: any;
  let resizeObserver: ResizeObserver;

  function createLabelElement(d: any) {    
    const el = document.createElement('div');
    el.className = 'globe-label absolute z-50 pointer-events-auto';
    
    let html = `<div class="bg-surface-800 p-3 rounded-lg shadow-xl border border-surface-600 text-white text-xs min-w-[150px]">
        <div class="flex justify-between items-start mb-2">
            <strong class="text-sm block">${d.region}</strong>
            <button class="close-btn opacity-50 hover:opacity-100 ml-2">✕</button>
        </div>
        <span class="block mb-2 text-surface-300">${d.count} Projects</span>`;
    
    html += `<a href="/gallery?search=${encodeURIComponent(d.region)}"  target="_blank"
               class="btn preset-filled-primary-500 w-full" >
               View Projects
            </a>`;
    
    html += `</div>`;
    el.innerHTML = html;

    // Handle close button
    el.querySelector('.close-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedPoint = null;
        updateGlobe();
    });

    return el;
  }

  function updateGlobe() {
    if (!globe) return;
    
    // Use htmlElements layer for the interactive popup
    globe.htmlElementsData(selectedPoint ? [selectedPoint] : []);
  }

  function handleZoomIn() {
    if (!globe) return;
    const { lat, lng, altitude } = globe.pointOfView();
    if (altitude > 0.1) {
        globe.pointOfView({ lat, lng, altitude: altitude * 0.7 }, 500);
    }
  }

  function handleZoomOut() {
    if (!globe) return;
    const { lat, lng, altitude } = globe.pointOfView();
    if (altitude < 5) {
        globe.pointOfView({ lat, lng, altitude: altitude * 1.4 }, 500);
    }
  }

  function handleReset() {
    if (!globe) return;
    globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 500);
    selectedPoint = null;
    updateGlobe();
  }

  function handleToggleRotate() {
    if (!globe) return;
    isAutoRotating = !isAutoRotating;
    
    // Only resume rotation if not currently hovering
    if (!isHovering) {
        globe.controls().autoRotate = isAutoRotating;
    }
  }

  let isHovering = false;
  function handleMouseEnter() {
    isHovering = true;
    if (globe && isAutoRotating) {
        globe.controls().autoRotate = false;
    }
  }

  function handleMouseLeave() {
    isHovering = false;
    if (globe && isAutoRotating) {
        globe.controls().autoRotate = true;
    }
  }

  onMount(async () => {

    console.log($state.snapshot(data))
      
      if (!browser) return;
      const module = await import('globe.gl');
      Globe = module.default;
      
      globe = Globe()
        (globeContainer)
        .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
        .pointsData(data)
        .pointLat('lat')
        .pointLng('lng')
        .pointLabel(null) // Disable hover tooltips
        .pointAltitude((d: any) => Math.min(d.count * 0.009 + 0.04, 0.3))
        .pointRadius(0.18)
        .pointColor((d: any) => {
            return d.popular_color?.hex || '#ffcc00';
        })
        .onPointClick((d: any) => {
            selectedPoint = d;
            
            // Pause rotation when a point is clicked
            if (isAutoRotating) {
                isAutoRotating = false;
                globe.controls().autoRotate = false;
            }
            
            updateGlobe();
        })
        .htmlLat('lat')
        .htmlLng('lng')
        .htmlElement(createLabelElement);
        
      globe.controls().autoRotate = isAutoRotating;
      globe.controls().autoRotateSpeed = 0.5;

      // Handle responsiveness
      resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
              const { width, height } = entry.contentRect;
              globe.width(width);
              globe.height(height);
          }
      });
      resizeObserver.observe(globeContainer);
  });

  onDestroy(() => {
    if (globe) {
        globe._destructor();
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
  });
</script>

<div 
    class="w-full h-[600px] relative group overflow-hidden bg-black rounded-container border border-surface-700 shadow-2xl"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    role="application"
    aria-label="Interactive 3D Globe Visualization"
>
    <div bind:this={globeContainer} class="w-full h-full cursor-move"></div>
    
    <!-- UI Controls Overlay -->
    <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button 
            onclick={handleZoomIn}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title="Zoom In"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-in"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
        <button 
            onclick={handleZoomOut}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title="Zoom Out"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zoom-out"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
        </button>
        <button 
            onclick={handleReset}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title="Reset View"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button 
            onclick={handleToggleRotate}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title={isAutoRotating ? "Pause Rotation" : "Resume Rotation"}
        >
            {#if isAutoRotating}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            {/if}
        </button>
    </div>

    {#if !data || data.length === 0}
        <div class="absolute inset-0 flex items-center justify-center text-surface-400 pointer-events-none">
            No projects found for the heatmap.
        </div>
    {/if}
</div>

<style>
    /* Ensure the globe container allows for the absolute labels relative to it */
    :global(.globe-label) {
        transform: translate(-50%, -100%);
        margin-top: -10px;
    }

    .rounded-container {
        border-radius: var(--radius-lg, 1rem);
    }
</style>
