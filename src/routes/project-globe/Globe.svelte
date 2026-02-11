<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script lang="ts">
  import { browser } from '$app/environment';
  import { pluralize } from '$lib/utils';
  import { LoaderCircleIcon, PauseIcon, PlayIcon, RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from '@lucide/svelte';
  import { onDestroy, onMount, tick } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { globeState } from './globe-state.svelte';
  import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';

  // Modern devices detection for hover support
  const canHover = new MediaQuery('(hover: hover)');

  // Reactivity
  let selectedPoint = $state(null);
  let isAutoRotating = $state(true);
  let globeContainer: HTMLElement | undefined = $state();
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
    
    let html = `<div class="bg-surface-800 p-2 rounded-lg shadow-xl border border-surface-600 text-white text-xs min-w-[240px] max-w-[280px] flex flex-col gap-2 relative cursor-default">
        <div class="flex justify-between items-center border-b border-surface-600 pb-1 mb-1">
            <p class="text-xs font-semibold uppercase tracking-wider opacity-60">${d.projects.length} ${pluralize('Project', d.projects.length)} in this area</p>
            <button class="close-btn hover:text-primary-500 transition-colors px-1">✕</button>
        </div>
        <div class="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">`;
    
    d.projects.forEach((proj: any) => {
        html += `<div class="group flex flex-col gap-1 border-b border-surface-700/50 pb-2 last:border-0">
            <div class="flex gap-2 items-start">
               ${proj.image ? `<img src="${proj.image}" alt="" class="size-24 object-cover rounded border border-surface-600 shrink-0" />` : ''}
               <div class="flex flex-col gap-1 min-w-0">
                    <p class="text-xs font-semibold line-clamp-4 leading-tight">${proj.title}</p>
                    <button class="open-btn text-xs btn bg-primary-700 text-white py-0.5 w-fit" data-id="${proj.id}">
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
    if (!globeState.globe) return;
    
    // Use htmlElements layer for the interactive popup
    globeState.globe.htmlElementsData(selectedPoint ? [selectedPoint] : []);
  }

  function handleZoomIn() {
    if (!globeState.globe) return;
    const { lat, lng, altitude } = globeState.globe.pointOfView();
    if (altitude > 0.1) {
        globeState.globe.pointOfView({ lat, lng, altitude: altitude * 0.7 }, 500);
    }
  }

  function handleZoomOut() {
    if (!globeState.globe) return;
    const { lat, lng, altitude } = globeState.globe.pointOfView();
    if (altitude < 5) {
        globeState.globe.pointOfView({ lat, lng, altitude: altitude * 1.4 }, 500);
    }
  }

  function handleReset() {
    if (!globeState.globe) return;
    globeState.globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 500);
    selectedPoint = null;
    updateGlobe();
  }

  function handleToggleRotate() {
    if (!globeState.globe) return;
    isAutoRotating = !isAutoRotating;
    
    // Manual toggle overrides any hover state
    if (isAutoRotating) {
        isHovering = false; // Reset hover state if manually playing
    }
    
    globeState.globe.controls().autoRotate = isAutoRotating;
  }

  let isHovering = false;
  function handleMouseEnter() {
    if (!canHover.current) return;
    isHovering = true;
    if (globeState.globe && isAutoRotating) {
        globeState.globe.controls().autoRotate = false;
        isAutoRotating = false;
    }
  }

  function handleMouseLeave() {
    if (!canHover.current) return;
    isHovering = false;
    if (globeState.globe && !isAutoRotating) {
        globeState.globe.controls().autoRotate = true;
        isAutoRotating = true;
    }
  }

  onMount(async () => {
      
      if (!browser) return;

      // Ensure library is loaded
      if (!globeState.Globe) {
        const module = await import('globe.gl');
        globeState.Globe = module.default;
      }

      // Fetch data if needed
      if (!globeState.data.length && globeState.loading) {
          try {
            globeState.loading = true;
            // Fetch the data from the new REST API endpoint
            const res = await fetch(`${PUBLIC_WORDPRESS_BASE_URL}/wp-json/tbgalleryapi/v1/globe-data`);
            if (!res.ok) throw new Error('Failed to load globe data');
            const json = await res.json();
            globeState.data = json.data || [];
            globeState.updatedAt = json.updated_at || '';
            globeState.error = '';
        } catch (e) {
            console.error(e);
            globeState.error = 'Could not load visualization data. Please try again later.';
        } finally {
            globeState.loading = false;
        }
      }

      // Wait for DOM to catch up (specifically globeContainer being bound)
      await tick();
      
      if (globeState.Globe && globeContainer) {
        // Clean up any existing globe instance
        if (globeState.globe) {
            try { globeState.globe._destructor(); } catch(e) {}
        }
        globeState.globe = globeState.Globe()
            (globeContainer)
            .globeImageUrl('/images/earth-lowres.jpg')
            .backgroundImageUrl('/images/night-sky.png')
            .bumpImageUrl('/images/earthbumps.jpeg')
            .atmosphereAltitude(.2)
            .atmosphereColor('lightskyblue')
            .globeCurvatureResolution(8)
            .pointsData(globeState.data)
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
                    globeState.globe.controls().autoRotate = false;
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
            
            globeState.globe.controls().autoRotate = isAutoRotating;
            globeState.globe.controls().autoRotateSpeed = 1;

            // Throttled point radius update based on zoom (altitude)
            let lastAltitude = -1;
            const updatePointRadius = throttle(() => {
                if (!globeState.globe) return;
                const { altitude } = globeState.globe.pointOfView();

                if (altitude < 2 && !globeState.isHighResolution) {
                    globeState.globe.globeImageUrl('/images/earth-highres.jpg');
                    globeState.isHighResolution = true;
                }
                
                if (Math.abs(altitude - lastAltitude) < 0.02) return;
                lastAltitude = altitude;
                
                // Generally bigger points: increased multiplier and min/max bounds
                const newRadius = Math.round(Math.max(0.02, Math.min(0.2, altitude * 0.5)) * 1000) / 1000;
                globeState.globe.pointRadius(newRadius);
            }, 650);
            
            globeState.globe.controls().addEventListener('change', updatePointRadius);
        

        // Handle responsiveness
        resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (globeState.globe) {
                    globeState.globe.width(width);
                    globeState.globe.height(height);
                }
            }
        });
        resizeObserver.observe(globeContainer);
        
        // FINALLY set loading to false once the globe is ready to be shown
        globeState.loading = false;
      }

        
  });

  onDestroy(() => {    
    if (globeState.globe) {
        globeState.globe._destructor();
    }
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
  });
</script>


{#if globeState.error !== ''}
    <div class="text-error-500 text-center p-8 bg-error-900/10 rounded-lg border border-error-500/30">
        <p class="mb-4">{globeState.error}</p>
        <button onclick={() => window.location.reload()} class="btn variant-filled-error">
            Retry
        </button>
    </div>
{:else}
    <div 
        class="w-full h-[70dvh] sm:h-[75dvh] relative lg:rounded-container overflow-hidden lg:shadow-md bg-black"
        onmouseenter={handleMouseEnter}
        onmouseleave={handleMouseLeave}
        role="application"
        aria-label="Interactive 3D Globe Visualization"
    >
        <div bind:this={globeContainer} class="w-full h-full cursor-move"></div>
        
        {#if globeState.loading}
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <div class="size-74 rounded-full bg-surface-500/20 mb-4 shadow-xl flex items-center justify-center">
                    <LoaderCircleIcon class="animate-spin size-12 text-surface-300"  />
                </div>
                <p class="text-surface-400 font-medium">Loading World...</p>
            </div>
        {/if}

        <!-- UI Controls Overlay -->
        <div class="absolute bottom-2 right-1/2 translate-x-1/2 flex gap-2 z-20">
            <button 
                onclick={handleToggleRotate}
                class="bg-surface-800/30 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600/40 transition-all shadow-lg backdrop-blur-sm"
                title={isAutoRotating ? "Pause Rotation" : "Resume Rotation"}
                disabled={globeState.loading}
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
                disabled={globeState.loading}
            >
                <RotateCcwIcon/>
            </button>
            
            <button 
                onclick={handleZoomOut}
                class="bg-surface-800/30 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600/40 transition-all shadow-lg backdrop-blur-sm"
                title="Zoom Out"
                disabled={globeState.loading}
            >
                <ZoomOutIcon/>
            </button>
            <button 
                onclick={handleZoomIn}
                class="bg-surface-800/30 hover:bg-surface-700 text-white p-2 rounded-lg border border-surface-600/40 transition-all shadow-lg backdrop-blur-sm"
                title="Zoom In"
                disabled={globeState.loading}
            >
                <ZoomInIcon/>
            </button>
        </div>

        
        {#if !globeState.loading && globeState.data.length === 0 && globeState.error === ''}
            <div class="absolute inset-0 flex items-center justify-center text-surface-400 pointer-events-none z-0">
                Error getting projects.
            </div>
        {/if}
    </div>

    <div class="mt-1 mb-4 text-center flex flex-col items-center justify-center gap-1 w-full px-2">
        <p class="text-sm text-surface-700-300">Touch or click a point to see projects from that area.</p>
        <!-- Last Updated Notice -->
        {#if globeState.updatedAt}
        <p class="text-xs pointer-events-none text-surface-400-600">
            Updated once a day. Last updated: {new Date(globeState.updatedAt.replace(' ', 'T')).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
        {/if}
    </div>
{/if}

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
