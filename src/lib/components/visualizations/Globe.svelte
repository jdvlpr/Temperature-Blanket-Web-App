<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { PauseIcon, PlayIcon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from '@lucide/svelte';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  
  // Svelte 5 Props
  let { data = [], updatedAt = '' } = $props<{ 
    data: any[],
    updatedAt?: string
  }>();

  // Modern devices detection for hover support
  const canHover = new MediaQuery('(hover: hover)');


  // Reactivity
  let selectedPoint = $state(null);
  let isAutoRotating = $state(true);
  let globeContainer: HTMLElement | undefined = $state();
  let Globe: any = $state();
  let globe: any = $state();
  let resizeObserver: ResizeObserver | undefined = $state();
 
  // Local throttle utility
  function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function(this: any, ...args: Parameters<T>) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  function createLabelElement(d: any) {    
    const el = document.createElement('div');
    el.className = 'globe-label absolute z-50 pointer-events-auto';
    
    let html = `<div class="bg-surface-800 p-2 rounded-lg shadow-xl border border-surface-600 text-white text-xs min-w-[200px] max-w-[240px] flex flex-col gap-2 relative">
        <div class="flex justify-between items-center border-b border-surface-600 pb-1 mb-1">
            <strong class="text-[10px] uppercase tracking-wider opacity-60">${d.projects.length} Projects in this area</strong>
            <button class="close-btn hover:text-primary-500 transition-colors px-1">✕</button>
        </div>
        <div class="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">`;
    
    d.projects.forEach((proj: any) => {
        html += `<div class="group flex flex-col gap-1 border-b border-surface-700/50 pb-2 last:border-0">
            <div class="flex gap-2 items-start">
               ${proj.image ? `<img src="${proj.image}" alt="" class="w-12 h-12 object-cover rounded border border-surface-600 shrink-0" />` : ''}
               <div class="flex flex-col gap-1 min-w-0">
                    <strong class="text-xs line-clamp-2 leading-tight">${proj.title}</strong>
                    <button class="open-btn btn btn-sm preset-filled-primary-500 py-0.5 text-[10px] w-fit" data-id="${proj.id}">
                        View Details
                    </button>
               </div>
            </div>
        </div>`;
    });
    
    html += `</div></div>`;
    el.innerHTML = html;

    // Handle open buttons
    el.querySelectorAll('.open-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = (btn as HTMLElement).dataset.id;
            window.open(`/gallery/${id}`, '_blank');
            selectedPoint = null;
            updateGlobe();
        });
    });

    // Prevent interactions on the label from reaching the globe
    const stopPropagation = (e: Event) => e.stopPropagation();
    el.addEventListener('click', stopPropagation);
    el.addEventListener('pointerdown', stopPropagation);
    el.addEventListener('pointerup', stopPropagation);
    el.addEventListener('mousedown', stopPropagation);
    el.addEventListener('mouseup', stopPropagation);
    el.addEventListener('wheel', stopPropagation); // Allow scrolling within the popup

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
    
    // Manual toggle overrides any hover state
    if (isAutoRotating) {
        isHovering = false; // Reset hover state if manually playing
    }
    
    globe.controls().autoRotate = isAutoRotating;
  }

  let isHovering = false;
  function handleMouseEnter() {
    if (!canHover.current) return;
    isHovering = true;
    if (globe && isAutoRotating) {
        globe.controls().autoRotate = false;
    }
  }

  function handleMouseLeave() {
    if (!canHover.current) return;
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
        .globeImageUrl('/images/earth_highres.jpg')
        .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .bumpImageUrl('/images/earthbumps.jpeg')
        .atmosphereAltitude(.2)
        .atmosphereColor('lightskyblue')
        .globeCurvatureResolution(8)
        .pointsData(data)
        .pointLat('lat')
        .pointLng('lng')
        .pointLabel(null) // Disable hover tooltips
        .pointResolution(8)
        .pointAltitude((d: any) => Math.min((d.projects?.length || 1) * 0.009 + 0.02, 0.5))
        .pointRadius(0.5)
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
      globe.controls().autoRotateSpeed = 1;

      // Throttled point radius update based on zoom (altitude)
      let lastAltitude = -1;
      const updatePointRadius = throttle(() => {
          if (!globe) return;
          const { altitude } = globe.pointOfView();    
          
          if (Math.abs(altitude - lastAltitude) < 0.02) return;
          lastAltitude = altitude;
          
          // Generally bigger points: increased multiplier and min/max bounds
          const newRadius = Math.round(Math.max(0.02, Math.min(0.2, altitude * 0.5)) * 1000) / 1000;
          globe.pointRadius(newRadius);
      }, 650);

      globe.controls().addEventListener('change', updatePointRadius);

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
    class="w-full h-[70dvh] sm:h-[75dvh] relative lg:rounded-container overflow-hidden lg:shadow-md"
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    role="application"
    aria-label="Interactive 3D Globe Visualization"
>
    <div bind:this={globeContainer} class="w-full h-full cursor-move"></div>
    
    <!-- UI Controls Overlay -->
    <div class="absolute bottom-2 right-1/2 translate-x-1/2 flex gap-2">
        <button 
            onclick={handleToggleRotate}
            class="bg-surface-800/30 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600/40 transition-all shadow-lg backdrop-blur-sm"
            title={isAutoRotating ? "Pause Rotation" : "Resume Rotation"}
        >
            {#if isAutoRotating}
                <PauseIcon/>
            {:else}
                <PlayIcon/>
            {/if}
        </button>
        <button 
            onclick={handleReset}
            class="bg-surface-800/30 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600/40 transition-all shadow-lg backdrop-blur-sm"
            title="Reset View"
        >
            <RotateCcwIcon/>
        </button>
        
        <button 
            onclick={handleZoomOut}
            class="bg-surface-800/30 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600/40 transition-all shadow-lg backdrop-blur-sm"
            title="Zoom Out"
        >
            <ZoomOutIcon/>
        </button>
        <button 
            onclick={handleZoomIn}
            class="bg-surface-800/30 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600/40 transition-all shadow-lg backdrop-blur-sm"
            title="Zoom In"
        >
            <ZoomInIcon/>
        </button>
    </div>

    
    {#if !data || data.length === 0}
    <div class="absolute inset-0 flex items-center justify-center text-surface-400 pointer-events-none">
    Error getting projects.
    </div>
    {/if}
</div>

<div class="mt-1 text-center flex flex-col items-center justify-center gap-2 w-full">

    <p class="text-sm text-surface-500">Click on a point to see the projects in that location.</p>

<!-- Last Updated Notice -->
{#if updatedAt}
<p class="text-xs pointer-events-none text-surface-500">
    Global map last updated: {new Date(updatedAt.replace(' ', 'T')).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
</p>
{/if}
</div>

<style>
    /* Ensure the globe container allows for the absolute labels relative to it */
    :global(.globe-label) {
        transform: translate(-50%, -100%);
        margin-top: -10px;
    }

    :global(.scrollbar-thin::-webkit-scrollbar) {
        width: 4px;
    }
    :global(.scrollbar-thin::-webkit-scrollbar-track) {
        background: rgba(0,0,0,0.1);
    }
    :global(.scrollbar-thin::-webkit-scrollbar-thumb) {
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
    }
    :global(.scrollbar-thin::-webkit-scrollbar-thumb:hover) {
        background: rgba(255,255,255,0.3);
    }
</style>
