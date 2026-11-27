// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// Reporting and blocking from a gallery page (App Store guideline 1.2): Report
// Page… (modals/ReportPage.svelte) and Block This Person… (a confirm), from
// the page's ⋯ menu, an owner's gallery and the card menus. Focus goes back to
// the ⋯ button (`returnFocus`) when the dialog closes.

import ReportPage from '#lib/components/modals/ReportPage.svelte';
import { galleryBlocks } from '#lib/accounts/gallery-blocks.svelte.js';
import { dialog, toast } from '#lib/state/page-state.svelte.js';

export type ReportReason = 'words' | 'photo' | 'spam' | 'other';

export const REPORT_REASON_LABELS: { value: ReportReason; label: string }[] = [
  { value: 'words', label: 'Inappropriate words' },
  { value: 'photo', label: 'Inappropriate photo' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Something else' },
];

export type GalleryPageRef = {
  postId: number;
  kind: 'project' | 'palette';
  /** Its name */
  title: string;
};

export function openReportPage(
  page: GalleryPageRef & { blockable: boolean },
  returnFocus?: () => HTMLElement | null,
) {
  void dialog.trigger({
    type: 'component',
    component: { ref: ReportPage, props: page },
    options: { title: 'Report Page', size: 'small' },
  });
  if (returnFocus) dialog.finalFocus = returnFocus;
}

/** Asks first, then blocks this page's publisher */
export function confirmBlock(
  page: GalleryPageRef,
  returnFocus?: () => HTMLElement | null,
) {
  void dialog.trigger({
    type: 'confirm',
    title: 'Block This Person?',
    body: 'You won’t see their pages in the Gallery, on the globe, or in Popular. They won’t be told.',
    confirmText: 'Block',
    danger: true,
    response: async (confirmed) => {
      if (!confirmed) return;
      try {
        await galleryBlocks.block(page);
        toast.trigger({
          message: 'Blocked. You won’t see this person’s pages.',
        });
      } catch (e) {
        toast.trigger({ message: (e as Error).message, category: 'error' });
      }
    },
  });
  if (returnFocus) dialog.finalFocus = returnFocus;
}

export async function unblock(postId: number) {
  try {
    await galleryBlocks.unblock(postId);
    toast.trigger({ message: 'Unblocked.' });
  } catch (e) {
    toast.trigger({ message: (e as Error).message, category: 'error' });
  }
}
