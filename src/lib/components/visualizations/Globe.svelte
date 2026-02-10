<script lang="ts">
  import { browser } from '$app/environment';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { PauseIcon, PlayIcon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from '@lucide/svelte';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  
  // Svelte 5 Props
  let { data = [] } = $props<{ data: any[] }>();

  // Theme Detection
  const isSystemDark = new MediaQuery('(prefers-color-scheme: dark)');
  const isDarkMode = $derived(
    preferences.value.theme.mode === 'dark' || 
    (preferences.value.theme.mode === 'system' && isSystemDark.current)
  );

  const nightTexture = '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg';
  const dayTexture = '//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';

  // Reactivity
  let selectedPoint = $state(null);
  let isAutoRotating = $state(true);
  let globeContainer: HTMLElement | undefined = $state();
  let Globe: any = $state();
  let globe: any = $state();
  let resizeObserver: ResizeObserver | undefined = $state();

  $effect(() => {
    isDarkMode;
    untrack(() => {
        if (globe) {
            globe.globeImageUrl(isDarkMode ? nightTexture : dayTexture);
            updateGlobe();
        }
    })
  });

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

    // Prevent clicks on the label from reaching the globe
    const stopPropagation = (e: Event) => e.stopPropagation();
    el.addEventListener('click', stopPropagation);
    el.addEventListener('pointerdown', stopPropagation);
    el.addEventListener('pointerup', stopPropagation);
    el.addEventListener('mousedown', stopPropagation);
    el.addEventListener('mouseup', stopPropagation);

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
      
      if (!browser) return;
      const module = await import('globe.gl');
      Globe = module.default;
      
      globe = Globe()
        (globeContainer)
        .globeImageUrl(isDarkMode ? nightTexture : dayTexture)
        .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
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
        .htmlElement(createLabelElement)
        .onGlobeClick(() => {
            if (selectedPoint) {
                selectedPoint = null;
                updateGlobe();
            }
        });
        
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
    class="w-full h-[75vh] relative overflow-hidden bg-black sm:rounded-container sm:shadow-lg"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    role="application"
    aria-label="Interactive 3D Globe Visualization"
>
{#key data.length}
    <div bind:this={globeContainer} class="w-full h-full cursor-move"></div>
    {/key}
    
    <!-- UI Controls Overlay -->
    <div class="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button 
            onclick={handleZoomIn}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title="Zoom In"
        >
            <ZoomInIcon/>
        </button>
        <button 
            onclick={handleZoomOut}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title="Zoom Out"
        >
            <ZoomOutIcon/>
        </button>
        <button 
            onclick={handleReset}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title="Reset View"
        >
            <RotateCcwIcon/>
        </button>
        <button 
            onclick={handleToggleRotate}
            class="bg-surface-800/80 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600 transition-all shadow-lg backdrop-blur-sm"
            title={isAutoRotating ? "Pause Rotation" : "Resume Rotation"}
        >
            {#if isAutoRotating}
                <PauseIcon/>
            {:else}
                <PlayIcon/>
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
</style>
