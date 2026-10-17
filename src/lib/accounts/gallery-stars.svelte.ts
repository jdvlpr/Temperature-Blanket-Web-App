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

// The signed-in account's stars: gallery pages starred to find again in My
// Library. Private bookmarks, never views. Loaded when the first star or the
// Starred list shows (not on every page: requests are shared by everyone on the
// free plan), again on focus at most once a minute while one shows, and only
// ever for the account signed in now.

import { account } from '#lib/accounts/summary.svelte.js';
import type { GalleryPostKind } from '#lib/server/gallery/store.js';
import type { GalleryStar } from '#lib/server/gallery/stars.js';
import { toast } from '#lib/state/page-state.svelte.js';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

const ENDPOINT = '/api/account/gallery/stars';
const FOCUS_INTERVAL_MS = 60_000;

class GalleryStarsState {
  /** Whose stars these are */
  #userId = $state<string | null>(null);
  #stars = new SvelteMap<number, GalleryStar>();
  /** The account's own gallery pages, which can't be starred */
  #own = new SvelteSet<number>();
  /** Stars being saved, so a second tap waits for the first */
  #saving = new SvelteSet<number>();
  #loading: Promise<void> | null = null;
  #lastLoad = 0;
  #shown = 0;
  /** Whether the last load failed (stars can't be shown or changed then) */
  failed = $state(false);

  /** Whether this account's stars have loaded */
  get loaded() {
    return this.#userId !== null && this.#userId === account.summary?.id;
  }

  /** Whether the account signed in now starred this page */
  has(postId: number) {
    return this.loaded && this.#stars.has(postId);
  }

  /** Whether this is one of the account's own pages: no star on it */
  isOwn(postId: number) {
    return this.loaded && this.#own.has(postId);
  }

  saving(postId: number) {
    return this.#saving.has(postId);
  }

  /** One kind's stars, newest first */
  list(kind: GalleryPostKind) {
    if (!this.loaded) return [];
    return [...this.#stars.values()]
      .filter((star) => star.kind === kind)
      .sort((a, b) => b.createdAt - a.createdAt || b.postId - a.postId);
  }

  load = () =>
    (this.#loading ??= (async () => {
      const userId = account.summary?.id;
      try {
        if (!__ACCOUNTS_ENABLED__ || !userId) return;
        this.#lastLoad = Date.now();
        const response = await fetch(ENDPOINT);
        if (!response.ok) throw new Error(`${response.status}`);
        const { stars, own } = (await response.json()) as {
          stars: GalleryStar[];
          own: number[];
        };
        // Signed out or into another account meanwhile
        if (account.summary?.id !== userId) return;
        this.#stars.clear();
        for (const star of stars) this.#stars.set(star.postId, star);
        this.#own.clear();
        for (const postId of own) this.#own.add(postId);
        this.#userId = userId;
        this.failed = false;
      } catch (e) {
        // Asked again on the next focus, or when a star is tapped
        console.error('Could not load gallery stars', e);
        if (account.summary?.id === userId) this.failed = true;
      } finally {
        this.#loading = null;
      }
    })());

  #onFocus = () => {
    if (document.visibilityState === 'hidden') return;
    if (Date.now() - this.#lastLoad < FOCUS_INTERVAL_MS) return;
    void this.load();
  };

  /**
   * Call when a star or the Starred list shows, signed in (again when the
   * account changes). Loads the stars unless they're this account's already.
   * Returns the cleanup.
   */
  start() {
    if (!this.loaded) {
      // Another account's stars never show, even for a moment
      this.#stars.clear();
      this.#own.clear();
      this.#userId = null;
      this.failed = false;
      void this.load();
    }
    if (this.#shown++ === 0) {
      window.addEventListener('focus', this.#onFocus);
      document.addEventListener('visibilitychange', this.#onFocus);
    }
    return () => {
      if (--this.#shown > 0) return;
      window.removeEventListener('focus', this.#onFocus);
      document.removeEventListener('visibilitychange', this.#onFocus);
    };
  }

  /**
   * Stars or unstars a page at once, putting it back with a toast when that
   * fails. Returns whether it's starred now, or null when nothing changed.
   */
  async toggle(postId: number, kind: GalleryPostKind): Promise<boolean | null> {
    if (this.#saving.has(postId)) return null;
    if (!this.loaded) {
      // The stars couldn't load: try again first
      await this.load();
      if (!this.loaded) {
        toast.trigger({
          message: 'Could not load your stars. Try again.',
          category: 'error',
        });
        return null;
      }
      if (this.#own.has(postId)) return null;
    }
    const before = this.#stars.get(postId);
    if (before) this.#stars.delete(postId);
    else this.#stars.set(postId, { postId, kind, createdAt: Date.now() });

    this.#saving.add(postId);
    try {
      const response = await fetch(ENDPOINT, {
        method: before ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(before ? { postId } : { postId, kind }),
      });
      if (!response.ok) {
        const { code, message } = await response.json().catch(() => ({}));
        throw Object.assign(new Error(message ?? `${response.status}`), {
          code,
          status: response.status,
        });
      }
      return !before;
    } catch (e) {
      if (before) this.#stars.set(postId, before);
      else this.#stars.delete(postId);
      const { code, message } = e as { code?: string; message?: string };
      toast.trigger({
        message:
          code === 'STAR_LIMIT' || code === 'OWN_PAGE'
            ? `${message}.`
            : before
              ? 'Could not unstar this page. Try again.'
              : 'Could not star this page. Try again.',
        category: 'error',
      });
      return null;
    } finally {
      this.#saving.delete(postId);
    }
  }
}

export const galleryStars = new GalleryStarsState();
