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

<!-- @component
  Beside a gallery card's name (in the Gallery, an owner's gallery and My
  Library's Starred): its star, then its ⋮ menu. Someone else's page: Open a
  Copy, More by <name> (when their name shows) and Copy Link. One of the
  account's own pages, no star: Copy Link and Edit Gallery Page…, which looks
  up the account's pages only when chosen. Own pages are known from the stars
  (loaded with them, so cards ask nothing more).
-->
<script lang="ts">
  import { resolve } from '$app/paths';
  import { galleryStars } from '#lib/accounts/gallery-stars.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import GalleryStarButton from '#lib/components/GalleryStarButton.svelte';
  import MoreMenu, {
    type MoreMenuItem,
  } from '#lib/components/buttons/MoreMenu.svelte';
  import { galleryOwners } from '#lib/state/gallery-owners.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { copyToClipboard } from '#lib/utils/clipboard-utils.js';
  import { getYarnPageURL } from '#lib/utils/color-utils.js';
  import { editGalleryPageById } from '#lib/utils/edit-gallery-page.js';
  import { fromGalleryLink } from '#lib/utils/gallery-request.js';
  import { withProjectName } from '#lib/utils/project-name-link.js';
  import {
    LinkIcon,
    NotebookPenIcon,
    PencilIcon,
    SwatchBookIcon,
    UserRoundIcon,
  } from '@lucide/svelte';

  interface Props {
    postId: number;
    kind: 'project' | 'palette';
    /** The page's name, for screen readers */
    name: string;
    /** A project page's: Open a Copy opens it in the planner, as its page does */
    project?: { url: string; name?: string | null };
    /** A palette's colors: Open a Copy opens them on the Yarn page, named */
    colors?: Color[];
    /** More by <name>; off on that owner's own gallery */
    moreBy?: boolean;
    /** Its star (off for a palette listed by its project's page) */
    star?: boolean;
  }

  let {
    postId,
    kind,
    name,
    project,
    colors,
    moreBy = true,
    star = true,
  }: Props = $props();

  // Open a Copy: with its name and the weather its page kept, as on its page
  let openHref = $derived.by(() => {
    if (project?.url) {
      try {
        // On this site, wherever the gallery saved it from (as its page does)
        const url = new URL(
          fromGalleryLink(
            withProjectName(project.url, project.name?.trim() ?? ''),
            postId,
          ),
        );
        return `${url.pathname}${url.search}${url.hash}`;
      } catch {
        return null;
      }
    }
    if (colors?.length)
      return `${getYarnPageURL({ colors, origin: '' })}&name=${encodeURIComponent(name)}`;
    return null;
  });

  let own = $derived(
    __ACCOUNTS_ENABLED__ && !!account.summary?.id && galleryStars.isOwn(postId),
  );
  let author = $derived(galleryOwners.nameOf(postId));
  let authorId = $derived(galleryOwners.publicIdOf(postId));

  let pagePath = $derived(
    kind === 'palette'
      ? resolve('/gallery/palette/[id]', { id: String(postId) })
      : resolve('/gallery/[id]', { id: String(postId) }),
  );

  let copyLink = $derived<MoreMenuItem>({
    value: 'copy-link',
    label: 'Copy Link',
    detail: 'The gallery page',
    icon: LinkIcon,
    onselect: () =>
      copyToClipboard(
        `${window.location.origin}${pagePath}`,
        'Link copied',
        'Unable to copy to your clipboard',
      ),
  });

  let items = $derived<MoreMenuItem[]>(
    own
      ? [
          copyLink,
          {
            value: 'edit',
            label: 'Edit Gallery Page…',
            icon: PencilIcon,
            onselect: () => editGalleryPageById(postId, kind),
          },
        ]
      : [
          ...(openHref
            ? [
                {
                  value: 'open-copy',
                  label: 'Open a Copy',
                  icon: project ? NotebookPenIcon : SwatchBookIcon,
                  href: openHref,
                  // The planner reads the project from the URL it starts with
                  reload: !!project,
                },
              ]
            : []),
          ...(moreBy && author && authorId
            ? [
                {
                  value: 'more-by',
                  label: `More by ${author}`,
                  icon: UserRoundIcon,
                  href:
                    kind === 'palette'
                      ? resolve('/gallery/by/[ownerId]/palettes', {
                          ownerId: authorId,
                        })
                      : resolve('/gallery/by/[ownerId]', { ownerId: authorId }),
                },
              ]
            : []),
          copyLink,
        ],
  );
</script>

<div class="flex shrink-0 items-start">
  {#if star}<GalleryStarButton {postId} {kind} {name} />{/if}
  <MoreMenu {items} label="More for {name}" />
</div>
