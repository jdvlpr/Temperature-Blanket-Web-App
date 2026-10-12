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

import { account, loadAccountSummary } from '#lib/accounts/summary.svelte.js';
import { locations } from '#lib/state/location-state.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { previews } from '#lib/state/preview-state.svelte.js';
import { project } from '#lib/state/project-state.svelte.js';
import { preferences } from '#lib/storage/preferences.svelte.js';
import { ProjectStorage } from '#lib/storage/projects.svelte.js';
import { loadProjectFromURL } from '#lib/utils/load-project-utils.svelte.js';
import { projectNameFromHash } from '#lib/utils/project-name-link.js';
import {
  GALLERY_PARAM,
  galleryRequestLink,
  parseGalleryRequest,
  type GalleryRequest,
} from '#lib/utils/gallery-request.js';

/**
 * Loads a project into the app's state: the one in the address bar on the
 * project page, or a saved one by its link (behind a dialog on My Projects).
 * Stored locations and weather come first, then the rest from the hash.
 */
export async function loadSavedProject(
  href?: string,
  { quiet = false }: { quiet?: boolean } = {},
) {
  const url = new URL(href ?? window.location.href);
  if (href) {
    project.onLoaded.href = url;
    project.onLoaded.isProject = url.searchParams.has('project');
    project.id = url.searchParams.get('project') ?? project.id;
  }

  if (project.onLoaded.isProject) await ProjectStorage.load();

  // A shared link's name, unless the project is saved here with its own
  const linkName = projectNameFromHash(url.hash);
  if (linkName && !(await ProjectStorage.getById(project.id)))
    project.linkName = linkName;

  await loadProjectFromURL(url.hash.substring(1), { quiet });

  if (locations.allValid) project.status.wasLoaded = true;
}

// The one saved project loaded on this page by loadInPlace(), with the units
// and seasons it set. The state can't be emptied again, so a different
// project needs a fresh page.
let loadedHere: {
  id: string | null;
  units: typeof preferences.value.units;
  seasons: typeof preferences.value.seasons;
} | null = null;

/** Whether a project was loaded on this page behind a dialog */
export const loadedInPlace = () => loadedHere !== null;

/** Whether this saved project can be loaded here: no other one was */
export const canLoadInPlace = (id: string) =>
  loadedHere === null || loadedHere.id === id;

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

/**
 * Loads a saved project behind a dialog, once per page. It needs the units
 * and seasons preferences set to the project's while it shows; the returned
 * function puts back the ones from before.
 */
export async function loadInPlace(href: string) {
  const id = new URL(href).searchParams.get('project');
  const before = preferencesSnapshot();
  if (loadedHere?.id === id) setPreferences(loadedHere);
  else {
    // Taken even if loading fails partway: the state isn't empty any more
    loadedHere = { id, ...before };
    await loadSavedProject(href, { quiet: true });
    // As the project page does for a link naming no preview (Previews.svelte)
    if (!previews.activeId) await previews.load('rows');
    // Done, as the project page says once it has loaded: previews draw now
    project.status.loading = false;
    loadedHere = { id, ...preferencesSnapshot() };
  }
  return () => setPreferences(before);
}

// My Projects' address for a project it opens Send to Gallery for, when the
// page has another project loaded already: ?gallery= plus its ID
export const GALLERY_FOR_PARAM = 'for';

/**
 * Opens Send to Gallery for a saved project over the current page (My
 * Projects), which loads the project behind it. If another project was loaded
 * here already, My Projects loads again first, opening it straight away.
 */
export async function openGalleryDialog(href: string, request: GalleryRequest) {
  const id = new URL(href).searchParams.get('project') ?? '';
  if (!canLoadInPlace(id)) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set(GALLERY_FOR_PARAM, id);
    window.location.assign(galleryRequestLink(url.href, request));
    return;
  }
  const { default: AddToGallery } =
    await import('#lib/components/modals/AddToGallery.svelte');
  dialog.trigger({
    type: 'component',
    component: { ref: AddToGallery, props: { request, href } },
    options: {
      title:
        request.action === 'replace'
          ? 'Update Gallery Page'
          : 'Send to Project Gallery',
    },
  });
}

/**
 * On My Projects: the Send to Gallery its address asks for (see
 * openGalleryDialog), taken out of the address so it opens once.
 */
export async function openGalleryDialogFromURL() {
  const url = new URL(window.location.href);
  const request = parseGalleryRequest(url.searchParams.get(GALLERY_PARAM));
  const id = url.searchParams.get(GALLERY_FOR_PARAM);
  if (!url.searchParams.has(GALLERY_PARAM) && !id) return;
  url.searchParams.delete(GALLERY_PARAM);
  url.searchParams.delete(GALLERY_FOR_PARAM);
  history.replaceState(history.state, '', url);
  if (!request || !id) return;
  // Sent from the account: the dialog needs to know it's signed in, and on a
  // fresh page the header may not have read that yet
  if (__ACCOUNTS_ENABLED__ && !account.summary) loadAccountSummary();
  const item = (await ProjectStorage.getIndex()).find((i) => i.id === id);
  if (item) await openGalleryDialog(item.meta.href, request);
}
