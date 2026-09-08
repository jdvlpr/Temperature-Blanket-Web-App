<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

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
  import { page } from '$app/state';
  import {
    LoaderCircleIcon,
    PauseIcon,
    PlayIcon,
    RotateCcwIcon,
    ZoomInIcon,
    ZoomOutIcon,
  } from '@lucide/svelte';
  import { onDestroy, onMount, tick } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { globeState } from './globe-state.svelte';
  import GlobePlacesPanel from './GlobePlacesPanel.svelte';
  import GlobeSpikePanel from './GlobeSpikePanel.svelte';
  import {
    applyAnisotropy,
    applySurface,
    clearTileCache,
    countTileRequests,
    findTileSource,
    isManualSurface,
    loadWorldLines,
    setManualSurface,
    tileLevelForAltitude,
    type SurfaceMode,
  } from './globe-textures';
  import {
    findNearestRegion,
    hasLabels,
    parseDeepLink,
    regionKey,
    regionsInView,
    searchRegions,
    type GlobeRegion,
    type GlobeRegionInView,
    type GlobeSearchResult,
  } from './globe-utils';
  import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';

  /** How many places the panel lists at once. The cap is what keeps the DOM
   * small while the camera moves; the panel reports what it leaves out. */
  const PANEL_LIMIT = 30;

  // ---------------------------------------------------------------------------
  // Zoom-detail spike (dev only, /globe?spike=1). Delete with globe-textures.ts
  // and GlobeSpikePanel.svelte once the surface question is settled.
  // ---------------------------------------------------------------------------
  const spikeActive = $derived(
    import.meta.env.DEV && page.url.searchParams.has('spike'),
  );
  let surface = $state<SurfaceMode>('lowres');
  let anisotropy = $state(false);
  let overlay = $state(false);
  let anisotropyLevel = $state(1);
  let fps = $state(0);
  let tileRequests = $state(0);
  let worldPaths = $state<[number, number][][]>([]);

  const tileLevel = $derived.by(() => {
    if (!import.meta.env.DEV) return null;
    const source = findTileSource(surface);
    if (!source) return null;
    return tileLevelForAltitude(globeState.pov.altitude, source.maxLevel);
  });

  async function handleOverlay(enabled: boolean) {
    if (!import.meta.env.DEV) return;
    overlay = enabled;
    if (!enabled || worldPaths.length) return;
    const lines = await loadWorldLines();
    if (lines) worldPaths = [...lines.coastline, ...lines.borders];
  }

  // Modern devices detection for hover support
  const canHover = new MediaQuery('(hover: hover)');

  // Reactivity
  let selectedRegion = $state<GlobeRegion | null>(null);
  let highlightedRegion = $state<GlobeRegion | null>(null);
  // Transient hover-suppression, distinct from the user's play/pause intent
  // (globeState.rotationEnabled). Keeping them separate is what lets a
  // deliberate pause survive the mouse leaving the globe. It covers the panel
  // as well as the globe, so the list holds still while it is being read.
  let isPointerOver = $state(false);
  let searchQuery = $state('');
  const searchResults = $derived(
    searchRegions(globeState.data as GlobeRegion[], searchQuery),
  );
  let globeContainer: HTMLElement | undefined = $state();
  let resizeObserver: ResizeObserver | undefined = $state();
  let handleCameraChange: ((...args: any[]) => void) | null = null;

  /**
   * The places the panel shows.
   *
   * The selected region is pinned to the front when the camera has moved it
   * out of the ranked list, so clicking a point never expands a row that is
   * not there to expand.
   */
  const placesInView = $derived.by(() => {
    const globe = globeState.globe;

    // Built once per recompute rather than per region, so the canvas
    // dimensions aren't re-read hundreds of times. Points behind the globe
    // also project onto the canvas, which is why regionsInView applies its
    // horizon test first and only then asks this.
    let isOnScreen: ((region: GlobeRegion) => boolean) | undefined;
    if (globe) {
      const width = globe.width();
      const height = globe.height();
      isOnScreen = (region) => {
        const { x, y } = globe.getScreenCoords(region.lat, region.lng, 0);
        return x >= 0 && x <= width && y >= 0 && y <= height;
      };
    }

    const { regions, total } = regionsInView(
      globeState.data as GlobeRegion[],
      globeState.pov,
      PANEL_LIMIT,
      isOnScreen,
    );

    if (selectedRegion && !regions.some((r) => r.region === selectedRegion)) {
      const pinned: GlobeRegionInView = {
        region: selectedRegion,
        centrality: 1,
      };
      return { regions: [pinned, ...regions], total };
    }

    return { regions, total };
  });

  // Local throttle utility. Fires on the leading edge, then once more after the
  // last call in a burst — without that trailing call the camera's final
  // resting position after a fly-to can land inside the throttle window and be
  // dropped, leaving the panel showing where the camera used to be.
  function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let trailingArgs: Parameters<T> | null = null;

    return function (this: any, ...args: Parameters<T>) {
      if (inThrottle) {
        trailingArgs = args;
        return;
      }

      func.apply(this, args);
      inThrottle = true;

      const settle = () => {
        if (trailingArgs) {
          const pending = trailingArgs;
          trailingArgs = null;
          func.apply(this, pending);
          setTimeout(settle, limit);
          return;
        }
        inThrottle = false;
      };

      setTimeout(settle, limit);
    };
  }

  /** Expand a region in the panel. Shared by point clicks, rows and search. */
  function selectRegion(region: GlobeRegion) {
    selectedRegion = region;

    // Opening a region is a deliberate stop, not a transient one: letting the
    // globe spin on would carry its point away from where the user is looking.
    globeState.rotationEnabled = false;
  }

  function toggleRegion(region: GlobeRegion) {
    if (selectedRegion === region) {
      selectedRegion = null;
      return;
    }
    selectRegion(region);
  }

  function chooseResult(result: GlobeSearchResult) {
    goToRegion(result.region);
    searchQuery = '';
  }

  /** Fly the camera to a region and expand it. */
  function goToRegion(region: GlobeRegion) {
    if (!globeState.globe) return;
    const { altitude } = globeState.globe.pointOfView();
    globeState.globe.pointOfView(
      { lat: region.lat, lng: region.lng, altitude: Math.min(altitude, 0.6) },
      800,
    );
    selectRegion(region);
  }

  // The one place that writes controls().autoRotate. Re-runs on remount once
  // globeState.globe is set, which keeps a reused instance in sync with intent.
  $effect(() => {
    if (!globeState.globe) return;
    globeState.globe.controls().autoRotate =
      globeState.rotationEnabled && !isPointerOver;
  });

  // Hovering a row pulses its point. A single-datum rings layer rather than
  // re-feeding pointsData, which would re-diff every point on the sphere.
  $effect(() => {
    if (!globeState.globe) return;
    globeState.globe.ringsData(highlightedRegion ? [highlightedRegion] : []);
  });

  // --- spike effects ---------------------------------------------------------

  // Tell the camera listener to stop swapping textures on its own.
  $effect(() => {
    if (!import.meta.env.DEV) return;
    setManualSurface(spikeActive);
  });

  $effect(() => {
    if (!import.meta.env.DEV) return;
    if (!spikeActive || !globeState.globe) return;
    applySurface(globeState.globe, surface);
  });

  // Applied here so a toggle takes effect at once; the frame loop below
  // reapplies it as textures and tiles finish loading.
  $effect(() => {
    if (!import.meta.env.DEV) return;
    if (!spikeActive || !globeState.globe) return;
    anisotropyLevel = applyAnisotropy(globeState.globe, anisotropy);
  });

  // Only the data changes here; the accessors are set once at creation. Paths
  // are left unstroked on purpose — a stroke builds a TubeGeometry per path,
  // the same per-object cost that made the old label layer unusable.
  $effect(() => {
    if (!import.meta.env.DEV) return;
    if (!globeState.globe) return;
    globeState.globe.pathsData(spikeActive && overlay ? worldPaths : []);
  });

  // One frame loop drives the FPS readout, the request count, and the
  // reapplication of anisotropy to textures that load asynchronously. Reading
  // `anisotropy` inside the callback is deliberate: it is untracked there, so
  // the loop is not torn down and rebuilt every time the box is ticked.
  $effect(() => {
    if (!import.meta.env.DEV || !spikeActive) return;

    let frames = 0;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick() {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
        tileRequests = countTileRequests();
        if (globeState.globe) {
          anisotropyLevel = applyAnisotropy(globeState.globe, anisotropy);
        }
      }
      raf = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  });

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
    selectedRegion = null;
  }

  function handleToggleRotate() {
    globeState.rotationEnabled = !globeState.rotationEnabled;
  }

  /**
   * Keyboard equivalent of dragging and scrolling the globe. Without this the
   * only reachable controls are the buttons below it — the globe itself could
   * not be moved at all without a pointer.
   */
  function handleKeydown(event: KeyboardEvent) {
    if (!globeState.globe) return;

    const { lat, lng, altitude } = globeState.globe.pointOfView();
    const step = 12 * Math.min(1, altitude);
    let next: { lat: number; lng: number; altitude: number } | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        next = { lat, lng: lng - step, altitude };
        break;
      case 'ArrowRight':
        next = { lat, lng: lng + step, altitude };
        break;
      case 'ArrowUp':
        next = { lat: Math.min(90, lat + step), lng, altitude };
        break;
      case 'ArrowDown':
        next = { lat: Math.max(-90, lat - step), lng, altitude };
        break;
      case '+':
      case '=':
        next = { lat, lng, altitude: Math.max(0.1, altitude * 0.7) };
        break;
      case '-':
      case '_':
        next = { lat, lng, altitude: Math.min(5, altitude * 1.4) };
        break;
      case 'Escape':
        if (selectedRegion) {
          event.preventDefault();
          selectedRegion = null;
        }
        return;
      default:
        return;
    }

    // Only preventDefault once we know the key is one we handle, so Tab and
    // browser shortcuts still work while the globe has focus.
    event.preventDefault();

    // Driving the camera by keyboard is an explicit navigation intent; letting
    // auto-rotation keep spinning would fight the user for control.
    globeState.rotationEnabled = false;
    globeState.globe.pointOfView(next, 250);
  }

  function handleMouseEnter() {
    if (!canHover.current) return;
    isPointerOver = true;
  }

  function handleMouseLeave() {
    if (!canHover.current) return;
    isPointerOver = false;
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
        const res = await fetch(
          `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/tbgalleryapi/v1/globe-data`,
        );
        if (!res.ok) throw new Error('Failed to load globe data');
        const json = await res.json();
        globeState.data = json.data || [];
        globeState.updatedAt = json.updated_at || '';
        globeState.hasLabels = hasLabels(globeState.data as GlobeRegion[]);
        globeState.error = '';
      } catch (e) {
        console.error(e);
        globeState.error =
          'Could not load visualization data. Please try again later.';
      } finally {
        globeState.loading = false;
      }
    }

    // Wait for DOM to catch up (specifically globeContainer being bound)
    await tick();

    if (globeState.Globe && globeContainer) {
      // Read deep-link params before the branch below. The reuse arm is the one
      // that runs on every return visit, so reading these inside the creation
      // arm would make /globe?lat=..&lng=.. work only on a hard page load and
      // silently do nothing when arriving via client-side navigation.
      const params = page.url.searchParams;
      const deepLink = parseDeepLink(params);

      // If globe already exists, reuse it — just move its DOM back in
      if (globeState.globe) {
        // The globe's internal container div was detached on last unmount;
        // re-attach it into the new component's container element.
        const internalContainer = globeState.globe
          .renderer()
          .domElement.closest('.scene-container')?.parentElement;
        if (internalContainer) {
          globeContainer.innerHTML = '';
          globeContainer.appendChild(internalContainer);
        }

        // Resize to fit the new container
        const { width, height } = globeContainer.getBoundingClientRect();
        globeState.globe.width(width).height(height);

        // Resume animation
        globeState.globe.resumeAnimation();
      } else {
        // First time: create the globe from scratch
        globeState.globe = new globeState.Globe(globeContainer)
          .globeImageUrl('/images/earth-lowres.jpg')
          .backgroundImageUrl('/images/night-sky.png')
          .bumpImageUrl('/images/earthbumps.jpeg')
          .atmosphereAltitude(0.2)
          .atmosphereColor('lightskyblue')
          .globeCurvatureResolution(8)
          .pointsData(globeState.data)
          .pointLat('lat')
          .pointLng('lng')
          .pointLabel(null as any) // Disable hover tooltips (null not in type def)
          // Each point is a cylinder, so this multiplies across every region on
          // the sphere; 6 segments is indistinguishable at these radii.
          .pointResolution(6)
          .pointAltitude((d: any) =>
            Math.max((d.projects?.length || 1) * 0.002, 0),
          )
          .pointRadius(0.5)
          .pointColor((d: any) => {
            return d.popular_color?.hex || '#ffcc00';
          })
          .onPointClick((d: any) => {
            selectRegion(d as GlobeRegion);
          })
          // A single-datum layer driven by panel hover. Empty by default.
          .ringsData([])
          .ringLat('lat')
          .ringLng('lng')
          .ringAltitude(0.015)
          .ringColor(() => (t: number) => `rgba(255,255,255,${1 - t})`)
          .ringMaxRadius(4)
          .ringPropagationSpeed(3)
          .ringRepeatPeriod(700)
          .ringResolution(32)
          .onGlobeReady(() => {
            // The instance exists well before the earth texture has decoded,
            // so keying the overlay off construction flashed a black square.
            globeState.loading = false;
          })
          .onGlobeClick(() => {
            selectedRegion = null;
          });

        // Spike-only path styling, configured once. Folds away in production.
        if (import.meta.env.DEV) {
          globeState.globe
            .pathColor(() => 'rgba(255, 255, 255, 0.4)')
            .pathPointAlt(() => 0.003)
            .pathTransitionDuration(0);
        }

        globeState.globe.controls().autoRotateSpeed = 1;

        // Throttled reaction to camera movement: resizes the points for the
        // current zoom and publishes the camera position the panel reads.
        let lastAltitude = -1;
        handleCameraChange = throttle(() => {
          if (!globeState.globe) return;
          const pov = globeState.globe.pointOfView();

          // Written to the singleton, not to component state: this closure is
          // registered once against a globe instance that outlives the
          // component, so it must not capture a field that dies with a remount.
          // Must stay above the early returns below — the panel is derived from
          // this, so skipping the write leaves it showing a stale camera.
          globeState.pov = pov;

          const { altitude } = pov;

          // Skipped while the spike drives the surface by hand — the
          // automatic swap would fight it, and this texture is one of the
          // things being compared. Read from module scope, not component
          // state: this closure outlives the component (see below).
          if (
            !(import.meta.env.DEV && isManualSurface()) &&
            altitude < 2 &&
            !globeState.isHighResolution
          ) {
            globeState.globe.globeImageUrl('/images/earth-highres.jpg');
            globeState.isHighResolution = true;
          }

          if (Math.abs(altitude - lastAltitude) < 0.015) return;
          lastAltitude = altitude;

          // Generally bigger points: increased multiplier and min/max bounds
          const newRadius =
            Math.round(Math.max(0.02, Math.min(0.2, altitude * 0.5)) * 1000) /
            1000;
          globeState.globe.pointRadius(newRadius);
        }, 350);

        globeState.globe
          .controls()
          .addEventListener('change', handleCameraChange);
      }

      if (deepLink) {
        globeState.globe.pointOfView(deepLink, 0);
        // A deep link is a deliberate destination; spinning away from it
        // immediately would undo the thing the link was for.
        globeState.rotationEnabled = false;

        // Open the place the link points at. Arriving from a gallery project
        // should land on that project's region, not on an unexplained camera
        // position the visitor still has to click to make sense of.
        const target = findNearestRegion(
          globeState.data as GlobeRegion[],
          deepLink.lat,
          deepLink.lng,
        );
        if (target) selectRegion(target);
      }

      // Seed the panel from wherever the camera actually is, covering both the
      // first mount and a return visit to a globe left pointing somewhere else.
      globeState.pov = globeState.globe.pointOfView();

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

      // Set loading to false once the globe is ready to be shown
      globeState.loading = false;
    }
  });

  onDestroy(() => {
    // Pause animation but keep the globe instance alive for reuse.
    // Globe.gl's _destructor() is too incomplete to properly clean up
    // (leaks WebGL context, CSS2DRenderer, Three.js textures, internal listeners).
    // Instead, we just pause and detach the DOM.
    if (globeState.globe) {
      globeState.globe.pauseAnimation();
      // The rings layer is driven by hover on a panel that is going away.
      globeState.globe.ringsData([]);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    // Module state, so it would otherwise outlive the page that set it and be
    // read by the camera listener on a plain /globe visit.
    if (import.meta.env.DEV) setManualSurface(false);
  });
</script>

{#if globeState.error !== ''}
  <div
    class="text-error-500 bg-error-900/10 border-error-500/30 rounded-lg border p-8 text-center"
  >
    <p class="mb-4">{globeState.error}</p>
    <button
      onclick={() => window.location.reload()}
      class="btn variant-filled-error"
    >
      Retry
    </button>
  </div>
{:else}
  <div class="flex w-full flex-col gap-2 lg:flex-row lg:items-start">
    <!--
      role="application" is the correct ARIA role for a canvas-driven widget that
      handles its own keys, and it has to be focusable to be reachable at all by
      keyboard. Svelte's a11y rules don't treat "application" as interactive, so
      both warnings below are false positives for this specific markup — the
      alternative (dropping tabindex) would make the globe pointer-only.
    -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="lg:rounded-container relative h-[42dvh] w-full flex-1 overflow-hidden bg-black sm:h-[52dvh] lg:h-[75dvh] lg:shadow-md"
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
      onkeydown={handleKeydown}
      role="application"
      tabindex="0"
      aria-label="Interactive 3D globe of temperature blanket projects. Use the arrow keys to rotate, plus and minus to zoom. The places currently in view are listed beside the globe."
    >
      <div bind:this={globeContainer} class="h-full w-full cursor-move"></div>

      {#if globeState.loading}
        <div
          class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div
            class="bg-surface-500/20 mb-4 flex size-52 items-center justify-center rounded-full shadow-xl"
          >
            <LoaderCircleIcon class="text-surface-300 size-12 animate-spin" />
          </div>
          <p class="text-surface-400 animate-pulse font-medium">
            Loading world...
          </p>
        </div>
      {/if}

      <!-- UI Controls Overlay -->
      <div class="absolute right-1/2 bottom-2 z-20 flex translate-x-1/2 gap-2">
        <button
          onclick={handleToggleRotate}
          class="bg-surface-800/30 hover:bg-surface-700 border-surface-600/40 rounded-lg border p-2 text-white shadow-lg backdrop-blur-sm transition-all"
          title={globeState.rotationEnabled
            ? 'Pause Rotation'
            : 'Resume Rotation'}
          disabled={globeState.loading}
        >
          {#if globeState.rotationEnabled}
            <PauseIcon />
          {:else}
            <PlayIcon />
          {/if}
        </button>
        <button
          onclick={handleReset}
          class="bg-surface-800/30 hover:bg-surface-700 border-surface-600/40 rounded-lg border p-2 text-white shadow-lg backdrop-blur-sm transition-all"
          title="Reset View"
          disabled={globeState.loading}
        >
          <RotateCcwIcon />
        </button>

        <button
          onclick={handleZoomOut}
          class="bg-surface-800/30 hover:bg-surface-700 border-surface-600/40 rounded-lg border p-2 text-white shadow-lg backdrop-blur-sm transition-all"
          title="Zoom Out"
          disabled={globeState.loading}
        >
          <ZoomOutIcon />
        </button>
        <button
          onclick={handleZoomIn}
          class="bg-surface-800/30 hover:bg-surface-700 border-surface-600/40 rounded-lg border p-2 text-white shadow-lg backdrop-blur-sm transition-all"
          title="Zoom In"
          disabled={globeState.loading}
        >
          <ZoomInIcon />
        </button>
      </div>
    </div>

    <GlobePlacesPanel
      inView={placesInView.regions}
      totalInView={placesInView.total}
      bind:searchQuery
      {searchResults}
      selectedKey={selectedRegion ? regionKey(selectedRegion) : null}
      hasLabels={globeState.hasLabels}
      loading={globeState.loading}
      isEmpty={globeState.data.length === 0}
      onSelect={toggleRegion}
      onHover={(region) => (highlightedRegion = region)}
      onChooseResult={chooseResult}
      onPointerEnter={handleMouseEnter}
      onPointerLeave={handleMouseLeave}
    />

    {#if import.meta.env.DEV && spikeActive}
      <GlobeSpikePanel
        {surface}
        {anisotropy}
        {overlay}
        {anisotropyLevel}
        altitude={globeState.pov.altitude}
        {tileLevel}
        {tileRequests}
        {fps}
        onSurface={(mode) => (surface = mode)}
        onAnisotropy={(enabled) => (anisotropy = enabled)}
        onOverlay={handleOverlay}
        onClearCache={() =>
          globeState.globe && clearTileCache(globeState.globe)}
      />
    {/if}
  </div>

  {#if !globeState.loading}
    <div
      class="mt-2 mb-4 flex w-full flex-col items-center justify-center gap-2 px-2 text-center"
    >
      <p class="text-surface-700-300 text-sm">
        Click a point on the globe, or a place in the list, to see its projects.
      </p>
      <!-- Last Updated Notice -->
      {#if globeState.updatedAt}
        <p class="text-surface-400-600 pointer-events-none text-xs">
          Updated once a day. Last updated: {new Date(
            globeState.updatedAt.replace(' ', 'T'),
          ).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      {/if}
    </div>
  {/if}
{/if}
