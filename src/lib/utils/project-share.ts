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

// The open project's share rows (Copy Link and its gallery page), in the
// Project menu and the preview's Share menu. Call inside $derived.

import { resolve } from '$app/paths';
import { shareRows } from '#lib/accounts/share-rows.js';
import AddToGallery from '#lib/components/modals/AddToGallery.svelte';
import { locations } from '#lib/state/location-state.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { project } from '#lib/state/project-state.svelte.js';
import {
  lastSavedAt,
  type StoredProjectIndexItem,
} from '#lib/storage/projects.svelte.js';
import { withProjectName } from '#lib/utils/project-name-link.js';

/**
 * The rows. `name` is the project's name and `item` the project as saved here,
 * read before (a clipboard write right after waiting on storage can be refused
 * in Safari); with `item`, they can tell whether the project is in the account
 * and whether it changed since its page was published.
 */
export function projectShareRows(
  name: string,
  item: StoredProjectIndexItem | undefined,
) {
  // Returnable, so the publish dialog has Back to the menu it came from
  const publish = (title: string) =>
    dialog.trigger({
      type: 'component',
      component: { ref: AddToGallery },
      options: { title, size: 'medium', returnable: true },
    });
  const here =
    typeof window === 'undefined'
      ? '/'
      : project.url.href.replace(window.location.origin, '');
  return shareRows({
    kind: 'project',
    id: project.id,
    // With its name, so whoever opens it sees it too
    link: withProjectName(project.url.href, name, locations.projectTitle),
    changed: item
      ? (page) =>
          (lastSavedAt(item) ?? 0) > (page.updatedAt ?? page.publishedAt)
      : undefined,
    signInHref: `${resolve('/auth/sign-in')}?redirect=${encodeURIComponent(here)}`,
    onpublish: () => publish('Publish to Gallery'),
    onedit: () => publish('Edit Gallery Page'),
    item,
  });
}
