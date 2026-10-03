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

// Signing out, from the account page or the account menu in the top bar. The
// account's projects leave this browser (the account keeps them), except ones
// that haven't finished syncing: those stay, so it asks first.

import { accountErrorMessage, signOut, signOutEverywhere } from './client';
import { forgetAccountSummary } from './summary.svelte';
import { dialog } from '$lib/state/page-state.svelte';

/** Ends the session, then removes the account's synced projects from here. */
async function finishSignOut(userId: string, everywhere: boolean) {
  if (everywhere) await signOutEverywhere();
  else await signOut();
  const { leaveAccount } = await import('$lib/sync/sync.svelte');
  await leaveAccount(userId, false);
  forgetAccountSummary();
}

/**
 * Signs out, asking first only when some of the account's projects here
 * haven't finished syncing.
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
    const { unsyncedCount } = await import('$lib/sync/sync.svelte');
    if (!(await unsyncedCount(userId))) {
      await finishSignOut(userId, everywhere);
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
          onconfirm: async () => {
            try {
              await finishSignOut(userId, everywhere);
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
