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

// Signing out, from the account page or the account menu in the top bar. When
// the account has projects in this browser, asks whether to keep them first.

import { accountErrorMessage, signOut, signOutEverywhere } from './client';
import { forgetAccountSummary } from './summary.svelte';
import { dialog } from '$lib/state/page-state.svelte';
import { ProjectStorage } from '$lib/storage/projects.svelte';

/** Ends the session, then settles what happens to the account's projects here. */
async function finishSignOut(
  userId: string,
  everywhere: boolean,
  keepProjects: boolean,
) {
  if (everywhere) await signOutEverywhere();
  else await signOut();
  const { leaveAccount } = await import('$lib/sync/sync.svelte');
  await leaveAccount(userId, keepProjects);
  forgetAccountSummary();
}

/**
 * Signs out, asking first about the account's projects in this browser.
 * `onSignedOut` runs once the session has ended; `onError` gets a message to
 * show, including for failures after the question was answered.
 */
export async function startSignOut({
  userId,
  everywhere = false,
  onSignedOut,
  onError,
}: {
  userId: string;
  everywhere?: boolean;
  onSignedOut?: () => void;
  onError: (message: string) => void;
}) {
  try {
    const projectCount = (await ProjectStorage.getIndex()).filter(
      (item) => item.sync?.ownerUserId === userId,
    ).length;

    if (!projectCount) {
      await finishSignOut(userId, everywhere, true);
      onSignedOut?.();
      return;
    }

    const { default: SignOutDialog } =
      await import('$lib/components/sync/SignOutDialog.svelte');
    dialog.trigger({
      type: 'component',
      component: {
        ref: SignOutDialog,
        props: {
          userId,
          everywhere,
          projectCount,
          onconfirm: async (keepProjects: boolean) => {
            try {
              await finishSignOut(userId, everywhere, keepProjects);
              onSignedOut?.();
            } catch (e) {
              onError(accountErrorMessage(e));
            }
          },
        },
      },
    });
  } catch (e) {
    onError(accountErrorMessage(e));
  }
}
