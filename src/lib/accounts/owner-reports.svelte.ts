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

// The site owner's count of gallery pages with new reports, for a badge on the
// account button. Only asked on a device where /gallery/reports has loaded for
// the owner (it says so in Local Storage), at most every 10 minutes, so no one
// else's browser ever asks. The owner checks /gallery/reports at least daily.

import { browser } from '$app/env';
import { account } from '#lib/accounts/summary.svelte.js';

const OWNER_KEY = 'tb_site_owner';
const COUNT_KEY = 'tb_new_reports';
const CHECK_MS = 10 * 60 * 1000;

class OwnerReportsState {
  /** Pages with new reports, or null when not the owner or not known */
  newCount = $state<number | null>(null);

  /** Called by /gallery/reports: whether this device's account is the owner's */
  remember(isOwner: boolean, newCount = 0) {
    try {
      if (isOwner && account.summary?.id) {
        localStorage.setItem(OWNER_KEY, account.summary.id);
        sessionStorage.setItem(
          COUNT_KEY,
          JSON.stringify({ at: Date.now(), count: newCount }),
        );
      } else {
        localStorage.removeItem(OWNER_KEY);
        sessionStorage.removeItem(COUNT_KEY);
      }
    } catch {
      // Storage blocked: no badge
    }
    this.newCount = isOwner ? newCount : null;
  }

  /** Asks how many, on the owner's devices only */
  async check() {
    if (!__ACCOUNTS_ENABLED__ || !browser) return;
    let owner: string | null;
    try {
      owner = localStorage.getItem(OWNER_KEY);
      const saved = JSON.parse(sessionStorage.getItem(COUNT_KEY) ?? 'null');
      if (
        owner &&
        owner === account.summary?.id &&
        saved?.at > Date.now() - CHECK_MS
      ) {
        this.newCount = saved.count;
        return;
      }
    } catch {
      return;
    }
    if (!owner || owner !== account.summary?.id) {
      this.newCount = null;
      return;
    }
    try {
      const response = await fetch('/api/gallery/reports?count=new');
      if (response.status === 401 || response.status === 403)
        return this.remember(false);
      if (!response.ok) return;
      const { newCount } = (await response.json()) as { newCount: number };
      this.remember(true, newCount);
    } catch {
      // Offline: asked again on the next page
    }
  }
}

export const ownerReports = new OwnerReportsState();
