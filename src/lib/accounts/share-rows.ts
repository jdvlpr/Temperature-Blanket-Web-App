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

// A project's or palette's share rows, the same wherever they show (a My
// Library card's ⋮, the planner's Project menu, the preview's Share menu and
// the Yarn page's Palette menu): Copy Link, then its one gallery page by
// state (under a Gallery Page heading), then a project's Ravelry project.
// Unpublish is in the Edit dialog. Call it inside $derived, so the
// rows follow the account, its gallery pages and Ravelry links.

import { resolve } from '$app/paths';
import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
import type { GalleryPage } from '#lib/accounts/gallery.js';
import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
import { account } from '#lib/accounts/summary.svelte.js';
import type { MoreMenuItem } from '#lib/components/buttons/MoreMenu.svelte';
import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
import { fromGalleryLink } from '#lib/utils/gallery-request.js';
import { inAccount } from '#lib/utils/open-ravelry.js';
import { pluralize } from '#lib/utils/string-utils.js';
import {
  ExternalLinkIcon,
  GlobeIcon,
  LinkIcon,
  LogInIcon,
  PencilIcon,
  SendIcon,
} from '@lucide/svelte';

export type ShareTarget = {
  kind: 'project' | 'palette';
  /** The saved project's or palette's ID, which its gallery page is of ('' unsaved) */
  id: string;
  /** What Copy Link copies; none, no Copy Link */
  link?: string;
  /** Whether it changed since its page was published or updated */
  changed?: (page: GalleryPage) => boolean;
  /** Publishes it (opens the publish dialog) */
  onpublish?: () => void;
  /** Edits its page: update, Anonymous, Ravelry, Unpublish (opens the publish dialog) */
  onedit?: (page: GalleryPage) => void;
  /** Where Sign In to Publish goes, to come back here */
  signInHref?: string;
  /** A saved project: whether it's in the account, and its Ravelry project */
  item?: StoredProjectIndexItem;
};

/** Its gallery page, if it has one (each project or palette has one now) */
export function galleryPageOf(
  kind: 'project' | 'palette',
  id: string,
): GalleryPage | undefined {
  if (!id) return undefined;
  return galleryPages.pages
    .filter((p) => p.projectId === id && (p.kind ?? 'project') === kind)
    .sort((a, b) => b.publishedAt - a.publishedAt || b.postId - a.postId)[0];
}

/**
 * A project's link naming its gallery page (?g=), so whoever opens it gets the
 * weather the page kept rather than searching (gallery-weather.ts), and what
 * Copy Link says about it. Only while the page is up to date: a project
 * changed since gets the plain link.
 */
function withGalleryWeather({ kind, id, changed }: ShareTarget, link: string) {
  const page =
    kind === 'project' && __ACCOUNTS_ENABLED__ && galleryPages.loaded
      ? galleryPageOf(kind, id)
      : undefined;
  if (!page || !changed) return { link, copied: 'Link copied' };
  return changed(page)
    ? {
        link,
        copied:
          'Link copied, without weather, since this project changed after you published it',
      }
    : {
        link: fromGalleryLink(link, page.postId),
        copied: 'Link copied, with the weather from your gallery page',
      };
}

export const galleryPageHref = (page: GalleryPage) =>
  page.kind === 'palette'
    ? resolve('/gallery/palette/[id]', { id: String(page.postId) })
    : resolve('/gallery/[id]', { id: String(page.postId) });

/** The rows, in order; the first one has no separator before it */
export function shareRows(target: ShareTarget): MoreMenuItem[] {
  const { kind, id, link, changed, onpublish, onedit, signInHref, item } =
    target;
  const rows: MoreMenuItem[] = [];

  if (link)
    rows.push({
      value: 'copy-link',
      label: 'Copy Link',
      detail: 'Anyone with the link gets their own copy. Yours stays as it is.',
      icon: LinkIcon,
      onselect: () => {
        const share = withGalleryWeather(target, link);
        copyToClipboard(
          share.link,
          share.copied,
          'Unable to copy to your clipboard',
        );
      },
    });

  if (!__ACCOUNTS_ENABLED__) return rows;

  const publish = (detail?: string, disabled = false): MoreMenuItem => ({
    value: 'publish',
    heading: 'Gallery Page',
    label: disabled ? 'Publish to Gallery' : 'Publish to Gallery…',
    detail,
    icon: SendIcon,
    disabled,
    onselect: onpublish,
  });

  if (!account.summary?.id) {
    rows.push({
      value: 'sign-in',
      heading: 'Gallery Page',
      label: 'Sign In to Publish',
      icon: LogInIcon,
      href: signInHref ?? resolve('/auth/sign-in'),
      reload: true,
    });
    return rows;
  }

  if (!galleryPages.loaded) {
    rows.push(publish('Checking the gallery…', true));
    return rows;
  }

  // Its Ravelry project, once posted (from Edit Gallery Page)
  const ravelry =
    kind === 'project' && item && ravelryLinks.connected
      ? ravelryLinks.links.get(item.id)
      : undefined;

  const page = galleryPageOf(kind, id);
  if (!page) {
    if (kind === 'project' && item && !inAccount(item))
      // Its page follows the account's copy into and out of the Trash
      rows.push(publish('Add this project to your account first', true));
    else if (!galleryPages.publishing || !onpublish)
      rows.push(publish('Paused right now', true));
    else rows.push(publish());
  } else {
    rows.push(
      {
        value: 'view-page',
        heading: 'Gallery Page',
        label: 'View Gallery Page',
        icon: GlobeIcon,
        href: galleryPageHref(page),
        newTab: true,
      },
      {
        value: 'edit-page',
        label: 'Edit Gallery Page…',
        detail: changed?.(page) ? 'Changed since publishing' : undefined,
        warning: true,
        icon: PencilIcon,
        disabled: !onedit,
        onselect: () => onedit?.(page),
      },
    );
  }

  if (ravelry)
    rows.push({
      value: 'ravelry',
      label: 'View on Ravelry',
      detail: ravelry.photos.length
        ? `${ravelry.photos.length} ${pluralize('photo', ravelry.photos.length)}`
        : undefined,
      icon: ExternalLinkIcon,
      href: ravelry.url,
      newTab: true,
      separate: true,
    });

  return rows;
}

/**
 * Freshens what the rows show, signed in, as they open (it may have been
 * published from elsewhere since): the account's gallery pages, and for a
 * project its Ravelry link (once while the app is open)
 */
export function loadShareState(kind: 'project' | 'palette') {
  if (!__ACCOUNTS_ENABLED__ || !account.summary?.id) return;
  void galleryPages.load();
  if (kind === 'project') void ravelryLinks.load();
}
