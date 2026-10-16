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

// The open project's Share dialog (Copy Link and its gallery page), from the
// Project menu and the preview's Share button.

import { resolve } from '$app/paths';
import AddToGallery from '#lib/components/modals/AddToGallery.svelte';
import ShareDialog from '#lib/components/modals/ShareDialog.svelte';
import { locations } from '#lib/state/location-state.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { project } from '#lib/state/project-state.svelte.js';
import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
import { withProjectName } from '#lib/utils/project-name-link.js';

/**
 * Opens it. `name` is the project's name and `item` the project as saved here,
 * read before (a clipboard write right after waiting on storage can be refused
 * in Safari); with `item`, it can tell whether the project is in the account.
 */
export function openProjectShare(
  name: string,
  { item }: { item?: StoredProjectIndexItem } = {},
) {
  const label = name || locations.projectTitle || 'Project';
  const publish = (title: string) =>
    dialog.trigger({
      type: 'component',
      component: { ref: AddToGallery },
      options: { title, returnable: true },
    });
  const here = project.url.href.replace(window.location.origin, '');
  dialog.trigger({
    type: 'component',
    component: {
      ref: ShareDialog,
      props: {
        kind: 'project',
        id: project.id,
        label,
        // With its name, so whoever opens it sees it too
        link: withProjectName(project.url.href, name, locations.projectTitle),
        signInHref: `${resolve('/auth/sign-in')}?redirect=${encodeURIComponent(here)}`,
        onpublish: () => publish('Publish to Gallery'),
        onupdate: () => publish('Update Gallery Page'),
        ravelryItem: item,
      },
    },
    // Always returnable, so the publish dialog has Back to it
    options: { title: `Share “${label}”`, returnable: true },
  });
}
