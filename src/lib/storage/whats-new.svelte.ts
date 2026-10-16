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

// Pointing out what's new in a major version, once, to people who used the
// site before it: a line above each page (WhatsNewBanner) and a filled version
// pill in the navigation, until dismissed or What's New is opened. Someone new
// to the site has nothing to catch up on, so it starts as seen for them.

import { version } from '$app/env';
import { hadPreferences } from './preferences.svelte';

const KEY = 'whats_new_seen';

const major = (v: string | null) => (v ? parseInt(v, 10) || 0 : 0);

function readSeen(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeSeen(value: string) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Private browsing: it shows again next time
  }
}

class WhatsNew {
  /** The last version whose news was seen */
  seen = $state<string | null>(version);

  constructor() {
    // On the server, nothing to show
    if (typeof localStorage === 'undefined') return;
    let seen = readSeen();
    if (seen === null && !hadPreferences) {
      seen = version;
      writeSeen(seen);
    }
    this.seen = seen;
  }

  /** Whether this major version's news is still to be seen */
  get show() {
    return major(this.seen) < major(version);
  }

  markSeen() {
    if (!this.show) return;
    this.seen = version;
    writeSeen(version);
  }
}

export const whatsNew = new WhatsNew();
