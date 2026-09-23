/** Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. */

import type { GlobeInstance, ConfigOptions } from 'globe.gl';
import type { GlobePointOfView, GlobeRegion } from './globe-utils';

class GlobeState {
  data = $state<object[]>([]);
  updatedAt = $state<string>('');
  loading = $state<boolean>(true);
  Globe = $state<{
    new (element: HTMLElement, configOptions?: ConfigOptions): GlobeInstance;
  } | null>(null);
  globe = $state<GlobeInstance | null>(null);
  /** The flat-disc marker module (globe-discs.ts), loaded alongside globe.gl
   * so three.js stays out of the server bundle. Not reactive: only the
   * globe's own layer accessors read it. */
  discs: typeof import('./globe-discs') | null = null;
  /** Canvas pixels at the top and bottom of the globe hidden behind the
   * sticky header and the mobile bottom sheet. A region under either is not
   * "in view": it gets no dot, no list row, and can't be tapped. Zero when the
   * globe sits beside the panel instead. */
  viewInsets = $state<{ top: number; bottom: number }>({ top: 0, bottom: 0 });
  /** The user's *intent* for auto-rotation, as set by the play/pause button.
   * Lives here rather than in the component because the globe instance is
   * reused across mounts (see Globe.svelte's onMount), so a component-local
   * flag would desync from the instance's actual autoRotate on remount.
   * Transient hover-suppression is tracked separately, in the component. */
  rotationEnabled = $state<boolean>(true);
  /** Whether the loaded payload carries per-project location names. False
   * against a cache written before the plugin change; the places panel falls
   * back to a project title when it is, so this only decides wording.
   * See globe-utils.ts. */
  hasLabels = $state<boolean>(false);
  /** The current camera position, which the places panel is derived from.
   * Lives here for the same reason rotationEnabled does, and for one more:
   * the throttled camera listener is registered once against the reused globe
   * instance and outlives the component, so its closure must write somewhere
   * that survives a remount. A component-local field would be written by a
   * dead component and the live one would never update. */
  pov = $state<GlobePointOfView>({ lat: 0, lng: 0, altitude: 2.5 });
  error = $state<string>('');

  /** The region being pointed at, from either the globe or the panel; drives
   * the ring pulse. Lives here, not in the component, for the same reason pov
   * does: the globe's hover handler is registered once against an instance
   * that is reused across mounts, so it must write somewhere that survives a
   * remount. Keeping one source also makes hovering a point highlight its row
   * and vice versa. */
  highlighted = $state<GlobeRegion | null>(null);

  /** True while the cursor is over a point, so the canvas can offer a pointer
   * instead of the drag cursor. */
  hoveringPoint = $state<boolean>(false);

  /**
   * Keys (`regionKey`) of the regions the last declutter recompute kept.
   * Not `$state` — nothing renders from this directly, it only feeds the
   * next recompute's hysteresis (see `declutterRegions`) and lets
   * `nearestPointTo` restrict a near-miss click to regions that actually
   * have a dot drawn. Plain field so it survives remount for the same
   * reason `onSelectRegion` does: the throttled camera listener that
   * maintains it is bound once, to a globe instance kept alive across
   * mounts.
   */
  previouslyKeptKeys = new Set<string>();

  /**
   * What clicking the globe should select; null clears the selection.
   *
   * An indirection because `onPointClick` and `onGlobeClick` are registered
   * once, when the globe is built, and that globe is deliberately kept alive
   * across mounts. A handler that closed over the component's own state would
   * keep writing to the *first* component after a navigation away and back,
   * leaving clicks on the live page doing nothing. Each mount re-assigns this.
   */
  onSelectRegion: ((region: GlobeRegion | null) => void) | null = null;
}
export const globeState = new GlobeState();
