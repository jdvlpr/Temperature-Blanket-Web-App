// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import { locations } from '#lib/state/location-state.svelte.js';
import { project } from '#lib/state/project-state.svelte.js';
import { weather } from '#lib/state/weather-state.svelte.js';
import {
  fitsLocations,
  type GalleryWeatherPage,
} from '#lib/utils/gallery-weather.js';

/**
 * A link's gallery pages that kept its weather, looked up alongside its
 * loading (lookUpGalleryWeather) and offered beside Search for Weather
 * (GalleryWeatherOffer.svelte) while the link has no weather: only for the
 * project they were looked up for, and only pages with its dates.
 */
class GalleryWeatherOffer {
  /** The project they're looked up for */
  projectId = $state<string | null>(null);
  checking = $state(false);
  pages = $state<GalleryWeatherPage[]>([]);

  /** Whether the open project is a link, without weather, they're for */
  #applies = $derived(
    !!this.projectId &&
      project.id === this.projectId &&
      project.status.loadedFrom === 'link' &&
      !weather.rawData.length &&
      locations.allValid,
  );

  showChecking = $derived(this.#applies && this.checking);

  fitting = $derived.by(() => {
    if (!this.#applies || this.checking) return [];
    const dates = locations.all.map(({ from, to }) => ({ from, to }));
    return this.pages.filter((page) => fitsLocations(page.locations, dates));
  });

  /** Looks them up; a slow gallery (or none here) offers nothing, as
   * loadGalleryWeather leaves a slow page's weather to a search */
  async lookUp(projectId: string, pages: Promise<GalleryWeatherPage[]>) {
    this.projectId = projectId;
    this.pages = [];
    this.checking = true;
    let found: GalleryWeatherPage[];
    try {
      found = await Promise.race([
        pages,
        new Promise<GalleryWeatherPage[]>((resolve) =>
          setTimeout(() => resolve([]), 5000),
        ),
      ]);
    } catch {
      found = [];
    }
    if (this.projectId !== projectId) return;
    this.pages = found;
    this.checking = false;
  }
}

export const galleryWeatherOffer = new GalleryWeatherOffer();
