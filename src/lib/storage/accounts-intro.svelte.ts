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

// Introducing accounts (in beta) to people who aren't signed in, each way
// once: a "New" dot on the account button until it's used, and a notice after
// the first thing they save

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { account } from '$lib/accounts/summary.svelte';
import { toast } from '$lib/state/page-state.svelte';

const KEY = 'accounts_intro';

export type AccountsIntroState = {
  /** The account button (with its "New" dot) has been used */
  buttonSeen: boolean;
  /** The notice after a first save has been shown */
  saveNoticeShown: boolean;
};

function readState(): AccountsIntroState {
  try {
    const state = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (state && typeof state === 'object')
      return { buttonSeen: false, saveNoticeShown: false, ...state };
  } catch {
    // Start over
  }
  return { buttonSeen: false, saveNoticeShown: false };
}

class AccountsIntro {
  // Empty on the server, where there's no Local Storage
  state = $state<AccountsIntroState>(readState());

  // Before a change: another tab may have made one since this loaded, which
  // writing this tab's older copy would undo
  #refresh() {
    this.state = readState();
  }

  #write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error(e);
    }
  }

  get #signedOut() {
    return __ACCOUNTS_ENABLED__ && !account.summary?.id;
  }

  /** Whether the account button shows its "New" dot */
  get showDot() {
    return this.#signedOut && !this.state.buttonSeen;
  }

  /** Call when the account button is used, or the account page is opened */
  markButtonSeen() {
    if (this.state.buttonSeen) return;
    this.#refresh();
    this.state.buttonSeen = true;
    this.#write();
  }

  /** Call after a project or palette is saved for the first time */
  offerAfterSave() {
    this.#refresh();
    if (!this.#signedOut || this.state.saveNoticeShown) return;
    this.state.saveNoticeShown = true;
    this.#write();
    toast.trigger({
      // One element, as the toast lays out its parts side by side
      message:
        '<span><b>Accounts (Beta).</b> Sign in to keep your projects and yarn palettes on all your devices.</span>',
      category: 'info',
      // Stays until dismissed, so there's time to read it and choose
      autohide: false,
      action: {
        label: 'Sign In',
        response: () => goto(resolve('/account')),
      },
    });
  }
}

export const accountsIntro = new AccountsIntro();
