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
import type { GlobePointOfView } from './globe-utils';

class GlobeState {
  data = $state<object[]>([]);
  updatedAt = $state<string>('');
  loading = $state<boolean>(true);
  Globe = $state<{
    new (element: HTMLElement, configOptions?: ConfigOptions): GlobeInstance;
  } | null>(null);
  globe = $state<GlobeInstance | null>(null);
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
}
export const globeState = new GlobeState();
