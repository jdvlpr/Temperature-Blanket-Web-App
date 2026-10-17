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

import { withoutVersion } from '#lib/utils/gallery-link-utils.js';
import { SvelteSet } from 'svelte/reactivity';
import { drawInFrame, hasThumbnail } from './thumbnails';

// One hidden frame at a time, wherever pictures are being drawn
let queue: Promise<unknown> = Promise.resolve();

/**
 * Saved projects' pictures, drawn in the background wherever projects are
 * listed (My Projects, the Trash, the Menu, adding them to an account): each
 * one without a picture of its current version gets one, one at a time (see
 * thumbnails.ts). Its `ProjectPicture` shows it as soon as it's kept
 * (`version`), and a placeholder until the drawing is done with it
 * (`isSettled`, by version: an edited project is drawn again).
 */
export class ProjectPictures {
  /** Bumped when a picture was drawn, for `ProjectPicture` to look again */
  version = $state(0);
  #settled = new SvelteSet<string>();

  #key = (id: string, href: string) => `${id} ${withoutVersion(href)}`;

  isSettled(id: string, href: string) {
    return this.#settled.has(this.#key(id, href));
  }

  /** Waits for the drawing to look again, e.g. back from the Trash */
  forget(id: string, href: string) {
    this.#settled.delete(this.#key(id, href));
  }

  /** Draws those without a picture; returns what stops it (for an effect) */
  draw(items: { id: string; href: string }[]): () => void {
    let stopped = false;
    let cancel: (() => void) | null = null;
    void (async () => {
      for (const { id, href } of items) {
        if (stopped) return;
        if (!href) continue;
        if (await hasThumbnail(id, href)) {
          this.#settled.add(this.#key(id, href));
          continue;
        }
        const turn = queue;
        let release = () => {};
        queue = new Promise<void>((resolve) => (release = resolve));
        await turn;
        try {
          if (stopped) return;
          // Drawn elsewhere while it waited
          const ok =
            (await hasThumbnail(id, href)) ||
            (await (() => {
              const drawing = drawInFrame(id, href);
              cancel = drawing.cancel;
              return drawing.done;
            })());
          cancel = null;
          if (stopped) return;
          this.#settled.add(this.#key(id, href));
          if (ok) this.version++;
        } finally {
          release();
        }
      }
    })();
    return () => {
      stopped = true;
      cancel?.();
    };
  }
}
