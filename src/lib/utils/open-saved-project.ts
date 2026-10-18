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

import { gauges } from '#lib/state/gauges-state.svelte.js';
import { locations } from '#lib/state/location-state.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { previews } from '#lib/state/preview-state.svelte.js';
import { project } from '#lib/state/project-state.svelte.js';
import { weather } from '#lib/state/weather-state.svelte.js';
import { weatherDays } from '#lib/state/weather-days.svelte.js';
import { preferences } from '#lib/storage/preferences.svelte.js';
import { ProjectStorage } from '#lib/storage/projects.svelte.js';
import { loadProjectFromURL } from '#lib/utils/load-project-utils.svelte.js';
import { projectNameFromHash } from '#lib/utils/project-name-link.js';
import { timestampFromLegacyProjectId } from '#lib/utils/project-id-utils.js';
import type { GalleryRequest } from '#lib/utils/gallery-request.js';
import {
  fetchGalleryWeather,
  findGalleryWeatherPages,
  galleryWeatherToLoad,
  type GalleryWeatherPage,
  isCustomGalleryWeather,
} from '#lib/utils/gallery-weather.js';
import { getMoonPhase } from '#lib/state/weather-state.svelte.js';

/**
 * Loads a project into the app's state: the one in the address bar on the
 * project page, or a saved one by its link (behind a dialog on My Projects).
 * Stored locations and weather come first, then the rest from the hash.
 * Opened from a gallery page (`fromGallery`, its post ID), the weather that
 * page kept loads when none is saved here.
 */
export async function loadSavedProject(
  href?: string,
  {
    quiet = false,
    fromGallery = null,
  }: { quiet?: boolean; fromGallery?: number | null } = {},
) {
  const url = new URL(href ?? window.location.href);
  // Fetched alongside the project's loading, not after it
  const galleryWeather = fromGallery ? fetchGalleryWeather(fromGallery) : null;
  if (href) {
    project.onLoaded.href = url;
    project.onLoaded.isProject = url.searchParams.has('project');
    project.id = url.searchParams.get('project') ?? project.id;
  }

  if (project.onLoaded.isProject) await ProjectStorage.load();

  // A shared link's name, unless the project is saved here with its own
  const saved = !!(await ProjectStorage.getById(project.id));
  const linkName = projectNameFromHash(url.hash);
  if (linkName && !saved) project.linkName = linkName;

  await loadProjectFromURL(url.hash.substring(1), { quiet });

  const fromGalleryPage =
    !!galleryWeather &&
    locations.allValid &&
    !weather.rawData.length &&
    (await loadGalleryWeather(galleryWeather));

  // The days loaded were got for these locations and this source (which the
  // link may have set after them)
  if (weather.rawData.length) weatherDays.markCurrent();

  if (locations.allValid) project.status.wasLoaded = true;
  project.status.loadedFrom = fromGalleryPage
    ? 'gallery'
    : !saved
      ? 'link'
      : weather.isUserEdited
        ? 'saved-custom'
        : 'saved';
}

/**
 * The gallery pages to offer the weather of, for a link loaded on the project
 * page without any: one not saved here, opened without a gallery page. Pages
 * published from a project with the same ID, with its dates (see
 * findGalleryWeatherPages); none for anything else.
 */
export async function galleryPagesForLink(): Promise<GalleryWeatherPage[]> {
  if (
    project.status.loadedFrom !== 'link' ||
    !project.onLoaded.isProject ||
    !locations.allValid ||
    weather.rawData.length
  )
    return [];
  return findGalleryWeatherPages(
    project.id,
    locations.all.map(({ from, to }) => ({ from, to })),
  );
}

/** Loads the weather of a gallery page chosen for the open link, as opening a
 * copy from it does. Whether it did */
export async function loadGalleryPageWeather(postId: number) {
  if (weather.rawData.length) return false;
  if (!(await loadGalleryWeather(fetchGalleryWeather(postId)))) return false;
  weatherDays.markCurrent();
  project.status.loadedFrom = 'gallery';
  return true;
}

/** Loads a gallery page's weather, as ProjectStorage.load() does a saved one.
 * Whether it did */
async function loadGalleryWeather(
  galleryWeather: ReturnType<typeof fetchGalleryWeather>,
): Promise<boolean> {
  // A slow gallery leaves the weather to a search rather than hold up the page
  const page = await Promise.race([
    galleryWeather,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
  ]);
  if (!page) return false;
  const days = galleryWeatherToLoad(page, locations.all);
  // A search may have started meanwhile
  if (!days || weather.rawData.length) return false;
  weather.isUserEdited = isCustomGalleryWeather(page.weatherSources);
  const loaded = days.map((day) => ({
    ...day,
    moon: day.moon || getMoonPhase(day.date),
  }));
  weather.setRawData(loaded);
  weatherDays.loaded(loaded);
  weather.wasLoadedFromStorage = true;
  return true;
}

// The saved project last loaded on this page by loadInPlace(), with the
// units and seasons it set
let loadedHere: {
  id: string | null;
  units: typeof preferences.value.units;
  seasons: typeof preferences.value.seasons;
} | null = null;

/** Whether a project was loaded on this page behind a dialog */
export const loadedInPlace = () => loadedHere !== null;

// (a plain copy: the seasons are a reactive proxy)
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const preferencesSnapshot = () => ({
  units: preferences.value.units,
  seasons: copy(preferences.value.seasons),
});

const setPreferences = ({
  units,
  seasons,
}: ReturnType<typeof preferencesSnapshot>) => {
  if (preferences.value.units !== units) preferences.value.units = units;
  if (JSON.stringify(preferences.value.seasons) !== JSON.stringify(seasons))
    preferences.value.seasons = seasons;
};

/** Empties the app's state of the last project, as a fresh page has it */
function resetProjectState(id: string | null) {
  weather.reset();
  weatherDays.reset();
  locations.reset();
  gauges.reset();
  previews.reset();
  project.createdAt = new Date(
    (id && timestampFromLegacyProjectId(id)) ?? Date.now(),
  ).toISOString();
  project.linkName = '';
  project.gallery = { href: '', title: '' };
  project.status.loading = true;
  project.status.wasLoaded = false;
  project.status.loadedFrom = null;
  project.status.error = { code: null, message: '' };
}

// The loadInPlace() under way: the next waits for it, so a dialog closed
// while its project loads can't have that project land over the next one's
let loading: Promise<unknown> = Promise.resolve();

/**
 * Loads a saved project behind a dialog, in place of the one loaded before
 * (or one only in the gallery, `fromGallery` its page, to save it again).
 * It needs the units and seasons preferences set to the project's while it
 * shows; the returned function puts back the ones from before. If the dialog
 * closed meanwhile (`closed`), it puts them back itself and returns nothing.
 */
export function loadInPlace(
  href: string,
  closed: () => boolean,
  { fromGallery = null }: { fromGallery?: number | null } = {},
) {
  const load = loading.then(() =>
    closed() ? undefined : loadNow(href, closed, fromGallery),
  );
  loading = load.catch(() => {});
  return load;
}

async function loadNow(
  href: string,
  closed: () => boolean,
  fromGallery: number | null,
) {
  const id = new URL(href).searchParams.get('project');
  // Only for this tab: a project open in another one keeps its units (and
  // doesn't record the change in its history)
  preferences.hold();
  const before = preferencesSnapshot();
  const restore = () => {
    setPreferences(before);
    preferences.release();
  };
  if (loadedHere?.id === id) setPreferences(loadedHere);
  else {
    // Set first: from here on the state is no longer a fresh page's
    loadedHere = { id, ...before };
    try {
      resetProjectState(id);
      await loadSavedProject(href, { quiet: true, fromGallery });
      // As the project page does for a link naming no preview (Previews.svelte)
      if (!previews.activeId) await previews.load('rows');
    } catch (error) {
      // Half loaded: the next try starts over
      loadedHere = { id: null, ...before };
      restore();
      throw error;
    }
    // Done, as the project page says once it has loaded: previews draw now
    project.status.loading = false;
    loadedHere = { id, ...preferencesSnapshot() };
  }
  if (!closed()) return restore;
  restore();
}

/**
 * Opens Publish to Gallery for a saved project over the current page (My
 * Projects), which loads the project behind it.
 */
export async function openGalleryDialog(href: string, request: GalleryRequest) {
  const { default: AddToGallery } =
    await import('#lib/components/modals/AddToGallery.svelte');
  dialog.trigger({
    type: 'component',
    component: { ref: AddToGallery, props: { request, href } },
    options: {
      title:
        request.action === 'replace'
          ? 'Edit Gallery Page'
          : 'Publish to Gallery',
      size: 'medium',
    },
  });
}
