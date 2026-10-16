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

// The account's Ravelry link while My Projects is open, shared by its cards:
// whether Ravelry is connected, and which projects are posted there. One
// request for the page, not one per card.

import {
  getRavelryStatus,
  listRavelryProjects,
  type RavelryProjectLink,
  type RavelryStatus,
} from '#lib/accounts/ravelry.js';
import { SvelteMap } from 'svelte/reactivity';

class RavelryLinksState {
  status = $state<RavelryStatus | null>(null);
  links = new SvelteMap<string, RavelryProjectLink>();

  /** Whether cards offer Ravelry: it's connected and working */
  get connected() {
    return (
      !!this.status?.available &&
      this.status.connected &&
      !this.status.needsReconnect &&
      !this.status.failed
    );
  }

  #loading: Promise<void> | null = null;

  load = () =>
    (this.#loading ??= (async () => {
      this.status = await getRavelryStatus();
      if (!this.connected) return;
      try {
        const links = await listRavelryProjects();
        // Ones unlinked meanwhile (deleted on Ravelry, say) go
        const ids = new Set(links.map((l) => l.projectId));
        for (const id of [...this.links.keys()])
          if (!ids.has(id)) this.links.delete(id);
        for (const link of links) this.links.set(link.projectId, link);
      } catch {
        // Cards show it as not posted; posting again finds the link
      }
    })());

  set(link: RavelryProjectLink) {
    this.links.set(link.projectId, link);
  }

  remove(projectId: string) {
    this.links.delete(projectId);
  }
}

export const ravelryLinks = new RavelryLinksState();
