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
  import {
    IMAGERY,
    applyAnisotropy,
    applyImagery,
    whenFirstTileLoads,
  } from './globe-imagery';
  import {
    declutterRegions,
    findNearestRegion,
    hasLabels,
    markerApparentPx,
    memoizeScreenOf,
    parseDeepLink,
    pointRadiusDegrees,
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

  /** How far a click may miss a point and still count, in canvas pixels.
   * This is what lets the points stay small: the hit target no longer has to
   * be the same size as the dot. */
  const CLICK_TOLERANCE_PX = 20;

  // Modern devices detection for hover support
  const canHover = new MediaQuery('(hover: hover)');

  // Reactivity
  let selectedRegion = $state<GlobeRegion | null>(null);
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
  let stopWaitingForTiles: (() => void) | null = null;

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

  /**
   * How much bigger to draw a dot than `markerApparentPx`'s own constants
   * alone would. Safe because declutter guarantees `SPACING_PX` (9px) of
   * screen-space clearance between any two kept marks — the reason the dot
   * was ever held down near 1px was overlap, and that constraint is gone
   * once declutter is thinning the set. The biggest a dot gets is a
   * max-weight region at the zoom floor, ~3.6px radius unscaled; 1.2x keeps
   * two such neighbours' combined diameter (~8.7px) under the 9px spacing
   * with a little margin, so the worst case still doesn't touch.
   */
  const DOT_SCALE = 1.2;

  /**
   * The `pointRadius` accessor, in degrees, for the camera as it is now.
   *
   * Handed to the layer afresh whenever the altitude moves, because
   * three-globe only re-evaluates an accessor when the prop is set. The fov
   * and canvas height are read from the live globe so the dot is the same size
   * on a phone as on a desktop.
   */
  function pointRadiusAccessor(): (d: object) => number {
    const globe = globeState.globe;
    const height = globe?.height() ?? 0;
    // camera() is typed as the base Camera, which has no fov; the default
    // perspective camera three.js builds uses 50.
    const camera = globe?.camera() as { fov?: number } | undefined;
    const fov = typeof camera?.fov === 'number' ? camera.fov : 50;

    return (d: object) => {
      const altitude = globeState.pov.altitude;
      const count = (d as GlobeRegion).projects?.length ?? 0;
      return pointRadiusDegrees(
        markerApparentPx(altitude, count) * DOT_SCALE,
        altitude,
        fov,
        height,
      );
    };
  }

  /**
   * The visible point nearest a spot on the globe, within the click tolerance.
   *
   * Compared in canvas pixels rather than degrees, because a tolerance in
   * degrees would cover a different amount of screen at every zoom and shrink
   * toward the poles. Runs per click rather than being kept as derived state —
   * a click is rare, and this way there is nothing extra to keep in sync.
   *
   * Returns null on a genuine miss, which the caller reads as "clear".
   */
  function nearestPointTo(lat: number, lng: number): GlobeRegion | null {
    const globe = globeState.globe;
    if (!globe) return null;

    const width = globe.width();
    const height = globe.height();
    const isOnScreen = (region: GlobeRegion) => {
      const { x, y } = globe.getScreenCoords(region.lat, region.lng, 0);
      return x >= 0 && x <= width && y >= 0 && y <= height;
    };

    // Uncapped: the panel's cap of 30 is about what is worth reading, and
    // clicking a point outside that list still has to work.
    const { regions } = regionsInView(
      globeState.data as GlobeRegion[],
      globeState.pov,
      Infinity,
      isOnScreen,
    );

    // Declutter only draws a dot for the last recompute's kept set, not
    // every in-view region — falling back to the full in-view list here
    // would let a tap select a region with no visible dot under it, which is
    // worse than the overlap this whole change exists to fix.
    const candidates = regions.filter((r) =>
      globeState.previouslyKeptKeys.has(regionKey(r.region)),
    );

    const click = globe.getScreenCoords(lat, lng, 0);
    let best: GlobeRegion | null = null;
    let bestDistance = CLICK_TOLERANCE_PX;

    for (const { region } of candidates) {
      const { x, y } = globe.getScreenCoords(region.lat, region.lng, 0);
      const distance = Math.hypot(x - click.x, y - click.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = region;
      }
    }
    return best;
  }

  /** Minimum on-screen distance, in canvas pixels, a kept dot guarantees from
   * every other kept dot — see `declutterRegions`. Small, because the dots
   * themselves stay only a couple of pixels wide; a small gap is enough to
   * stop them merging into a blob. */
  const SPACING_PX = 9;
  /** Hard cap on how many dots are kept, applied after spacing so a very
   * dense view degrades to "busiest N regions" rather than an unbounded mesh
   * count. */
  const BUDGET = 700;

  /**
   * Recomputes which regions actually get a dot and hands the result to the
   * points layer.
   *
   * A plain function, not a closure captured once: it reads and writes
   * nothing but `globeState`, so it is safe to call both from the
   * once-per-globe-instance throttled camera listener (see onMount) and,
   * separately, from whichever component instance is live right now — a
   * reused globe survives remounts, but this function doesn't need to care.
   */
  function updatePointSet() {
    const globe = globeState.globe;
    if (!globe) return;

    const width = globe.width();
    const height = globe.height();

    // Memoized per recompute: the on-screen test below and declutterRegions'
    // own screenOf both need the same region's projected position.
    const screenOf = memoizeScreenOf((region) =>
      globe.getScreenCoords(region.lat, region.lng, 0),
    );
    const isOnScreen = (region: GlobeRegion) => {
      const { x, y } = screenOf(region);
      return x >= 0 && x <= width && y >= 0 && y <= height;
    };

    // Uncapped candidate set: horizon + on-screen is what should decide
    // membership, not an arbitrary top-N handed to declutter before it runs.
    const { regions: onScreen } = regionsInView(
      globeState.data as GlobeRegion[],
      globeState.pov,
      Infinity,
      isOnScreen,
    );

    const kept = declutterRegions(
      onScreen.map((r) => r.region),
      screenOf,
      {
        spacingPx: SPACING_PX,
        budget: BUDGET,
        previouslyKept: globeState.previouslyKeptKeys,
      },
    );
    const keptKeys = new Set(kept.map(regionKey));
    globeState.previouslyKeptKeys = keptKeys;

    // A region can lose its slot mid-hover, with no pointerleave or
    // onPointHover(null) to clear it — the mesh is just gone. Without this
    // the ring pulse and pointer cursor stay locked onto a mark that no
    // longer exists.
    if (
      globeState.highlighted &&
      !keptKeys.has(regionKey(globeState.highlighted))
    ) {
      globeState.highlighted = null;
      globeState.hoveringPoint = false;
    }

    globe.pointsData(kept);
  }

  /** Select a region, or clear the selection when passed null. */
  function selectOrClear(region: GlobeRegion | null) {
    if (!region) {
      selectedRegion = null;
      return;
    }
    selectRegion(region);
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
    globeState.globe.ringsData(
      globeState.highlighted ? [globeState.highlighted] : [],
    );
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

  /**
   * Touch has no hover, so neither handler above ever fires on a phone and the
   * sphere keeps rotating while the user is trying to aim at a point. Treat
   * the first touch as the same explicit navigation intent the arrow keys
   * already carry; the play button puts rotation back.
   */
  function handlePointerDown() {
    if (canHover.current) return;
    globeState.rotationEnabled = false;
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
      }
      // Deliberately no `loading = false` here. The data arriving is not the
      // globe being ready to look at; that is decided below, once imagery has
      // actually painted. A failed fetch renders the error branch instead.
      if (globeState.error) globeState.loading = false;
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

        // A reused instance still has its tiles, so there is nothing to wait for.
        globeState.loading = false;
      } else {
        // First time: create the globe from scratch
        globeState.globe = new globeState.Globe(globeContainer)
          .backgroundImageUrl('/images/night-sky.png')
          .atmosphereAltitude(0.2)
          .atmosphereColor('lightskyblue')
          .globeCurvatureResolution(8)
          .pointsData(globeState.data)
          .pointLat('lat')
          .pointLng('lng')
          .pointLabel(null as any) // Disable hover tooltips (null not in type def)
          // Each point is a cylinder, so this multiplies across every region on
          // the sphere; 8 segments is indistinguishable at these radii.
          .pointResolution(8)
          // Flat. Height used to encode the project count uncapped, which made
          // the busiest region a 94px spike at the zoom floor beside a target
          // 0.6px wide — it hid its neighbours, and clicking the spike
          // selected the region at its base rather than under the pointer.
          // The count is a small width difference now instead.
          .pointAltitude(0)
          .pointRadius(pointRadiusAccessor())
          .pointColor(
            (d: object) => (d as GlobeRegion).popular_color?.hex ?? '#ffcc00',
          )
          .onPointClick((d: object) => {
            // Through the singleton, never captured: these handlers are bound
            // once to a globe that outlives the component.
            globeState.onSelectRegion?.(d as GlobeRegion);
          })
          .onPointHover((d: object | null) => {
            globeState.hoveringPoint = !!d;
            globeState.highlighted = (d as GlobeRegion | null) ?? null;
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
          .onGlobeClick(({ lat, lng }) => {
            // Clicking near a point counts as clicking it, so the dots can
            // stay small without being fiddly. A genuine miss still clears.
            globeState.onSelectRegion?.(nearestPointTo(lat, lng));
          });

        // Surface imagery. Kept out of the constructor chain because the
        // tile-engine methods are absent from globe.gl's type definitions.
        applyImagery(globeState.globe);

        // three-globe reports itself ready the moment a tile url is set,
        // without waiting for imagery, and the engine parks a black sphere
        // just under the surface — so the overlay waits for a real tile.
        stopWaitingForTiles = whenFirstTileLoads(() => {
          globeState.loading = false;
          if (globeState.globe) applyAnisotropy(globeState.globe);
        });

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

          // Tiles that stream in after this point start at anisotropy 1, so
          // this is reapplied as the camera moves. It only writes when a value
          // actually differs, so the repeat costs nothing.
          applyAnisotropy(globeState.globe);

          // Every tick, not gated on the altitude check below: rotating at a
          // constant altitude still moves every region's screen position (and
          // its foreshortening near the horizon), so which marks are too
          // close to draw changes on a drag too, not only on a zoom.
          updatePointSet();

          if (Math.abs(altitude - lastAltitude) < 0.015) return;
          lastAltitude = altitude;

          // Re-hand the accessor so the layer re-reads it at the new altitude:
          // three-globe only re-evaluates an accessor when the prop is set.
          globeState.globe.pointRadius(pointRadiusAccessor());
        }, 350);

        globeState.globe
          .controls()
          .addEventListener('change', handleCameraChange);
      }

      // Re-registered on every mount, reuse included: the globe's click
      // handlers were bound once, to the first component, so without this a
      // return visit would leave clicks updating a component that is gone.
      globeState.onSelectRegion = selectOrClear;

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

      // Seed the mark set immediately rather than waiting for the first
      // throttled camera-change tick, which — on a reused globe with rotation
      // already paused from a prior visit — might not fire at all for a while.
      updatePointSet();

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
    } else {
      // No globe to wait on, so nothing will ever clear the overlay otherwise.
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
    globeState.highlighted = null;
    globeState.hoveringPoint = false;
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    stopWaitingForTiles?.();
    stopWaitingForTiles = null;
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
      onpointerdown={handlePointerDown}
      onkeydown={handleKeydown}
      role="application"
      tabindex="0"
      aria-label="Interactive 3D globe of temperature blanket projects. Use the arrow keys to rotate, plus and minus to zoom. The places currently in view are listed beside the globe."
    >
      <div
        bind:this={globeContainer}
        class="h-full w-full {globeState.hoveringPoint
          ? 'cursor-pointer'
          : 'cursor-move'}"
      ></div>

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
      onHover={(region) => (globeState.highlighted = region)}
      onChooseResult={chooseResult}
      onPointerEnter={handleMouseEnter}
      onPointerLeave={handleMouseLeave}
    />
  </div>

  {#if !globeState.loading}
    <div
      class="mt-2 mb-4 flex w-full flex-col items-center justify-center gap-2 px-2 text-center"
    >
      <p class="text-surface-700-300 text-sm">
        Click a point on the globe, or a place in the list, to see its projects.
      </p>
      <!-- Required by the imagery licence; see globe-imagery.ts. -->
      <p class="text-surface-400-600 text-xs">
        Imagery: {IMAGERY.attribution}
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
