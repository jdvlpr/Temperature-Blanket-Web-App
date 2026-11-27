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

// People this person blocked on the gallery: their pages are left out of the
// gallery, its palettes, owners' galleries and the globe (which come straight
// from WordPress, so they're filtered here). The server decides which pages a
// block hides and never says who published them (server/gallery/blocks.ts).
//
// Signed in, blocks are the account's, loaded with the stars (one request).
// A guest's are the pages they blocked from, kept in Local Storage and sent
// once a visit to POST /api/gallery/blocked; they're added to the account at
// the first look after signing in.

import { browser } from '$app/env';
import { galleryStars } from '#lib/accounts/gallery-stars.svelte.js';
import { account } from '#lib/accounts/summary.svelte.js';
import type { GalleryBlock } from '#lib/server/gallery/blocks.js';
import type { GalleryPostKind } from '#lib/server/gallery/store.js';
import { SvelteMap } from 'svelte/reactivity';

export type { GalleryBlock };

const STORAGE_KEY = 'tb_gallery_blocks';
const BLOCKS = '/api/gallery/blocks';

/** A failed request's code and message, for the toast */
export class BlockError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

function readGuestBlocks(): GalleryBlock[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved)
      ? saved.filter(
          (block): block is GalleryBlock =>
            Number.isSafeInteger(block?.postId) && block.postId > 0,
        )
      : [];
  } catch {
    return [];
  }
}

function writeGuestBlocks(blocks: GalleryBlock[]) {
  try {
    if (blocks.length)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the block lasts this visit
  }
}

async function send(method: string, body: unknown) {
  const response = await fetch(BLOCKS, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const answer = await response.json().catch(() => null);
  if (!response.ok)
    throw new BlockError(
      answer?.message
        ? `${answer.message}.`
        : 'Something went wrong. Try again.',
      answer?.code,
    );
  return answer as { blocks: GalleryBlock[]; postIds: number[] };
}

class GalleryBlocksState {
  /** A guest's blocks, as kept on this device */
  #guest = $state<GalleryBlock[]>([]);
  /** The pages a guest's blocks hide, and the page each was blocked from */
  #guestHidden = new SvelteMap<number, number>();
  #guestAsked = false;
  #guestLoading: Promise<void> | null = null;
  #merging: Promise<void> | null = null;

  get #signedIn() {
    return !!account.summary?.id;
  }

  /** Whether this page's publisher is blocked: its card is left out */
  hides(postId: number | string) {
    const id = Number(postId);
    return this.#signedIn
      ? galleryStars.blocked.has(id)
      : this.#guestHidden.has(id);
  }

  /** The items whose pages aren't hidden (`databaseId` is the page's ID) */
  without<T extends { databaseId: number | string }>(items: T[]): T[] {
    if (!(this.#signedIn ? galleryStars.blocked : this.#guestHidden).size)
      return items;
    return items.filter((item) => !this.hides(item.databaseId));
  }

  /**
   * Call where gallery cards or the globe show: loads what's hidden, once a
   * visit (signed in, with the stars; a guest only when they blocked someone).
   */
  ensure(): Promise<void> {
    if (!__ACCOUNTS_ENABLED__ || !browser) return Promise.resolve();
    if (this.#signedIn)
      return this.#mergeGuest().then(() =>
        galleryStars.loaded ? undefined : galleryStars.load(),
      );
    if (!this.#guestAsked) {
      this.#guestAsked = true;
      this.#guest = readGuestBlocks();
      if (this.#guest.length) this.#guestLoading = this.#loadGuestHidden();
    }
    return this.#guestLoading ?? Promise.resolve();
  }

  async #loadGuestHidden() {
    try {
      const response = await fetch('/api/gallery/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockedPostIds: this.#guest.map((b) => b.postId),
        }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const { via } = (await response.json()) as {
        via: Record<string, number>;
      };
      this.#guestHidden.clear();
      for (const [postId, from] of Object.entries(via))
        this.#guestHidden.set(Number(postId), from);
      // The page blocked from, even when the server no longer has it
      for (const block of this.#guest)
        if (!this.#guestHidden.has(block.postId))
          this.#guestHidden.set(block.postId, block.postId);
    } catch (e) {
      // Cards show; asked again on the next visit
      console.error('Could not look up blocked gallery pages', e);
      this.#guestAsked = false;
    }
  }

  /** After signing in: a guest's blocks become the account's */
  #mergeGuest() {
    return (this.#merging ??= (async () => {
      const guest = readGuestBlocks();
      if (!guest.length) return;
      try {
        const { postIds } = await send('POST', {
          postIds: guest.map((b) => b.postId),
        });
        writeGuestBlocks([]);
        this.#guest = [];
        this.#guestHidden.clear();
        galleryStars.setBlocked(postIds);
      } catch (e) {
        console.error('Could not add blocks to the account', e);
        this.#merging = null;
      }
    })());
  }

  /**
   * Blocks the publisher of this page. Throws a BlockError with what to say
   * when it can't.
   */
  async block(page: { postId: number; kind: GalleryPostKind; title: string }) {
    if (this.#signedIn) {
      const { postIds } = await send('POST', { postId: page.postId });
      galleryStars.setBlocked(postIds);
      return;
    }
    this.#guest = [
      { ...page, createdAt: Date.now() },
      ...readGuestBlocks().filter((b) => b.postId !== page.postId),
    ];
    writeGuestBlocks(this.#guest);
    this.#guestHidden.set(page.postId, page.postId);
    await this.#loadGuestHidden();
  }

  /** Unblocks the publisher of this page: the block that hides it */
  async unblock(postId: number) {
    if (this.#signedIn) {
      const { postIds } = await send('DELETE', { postId });
      galleryStars.setBlocked(postIds);
      return;
    }
    const from = this.#guestHidden.get(postId) ?? postId;
    this.#guest = readGuestBlocks().filter(
      (b) => b.postId !== from && b.postId !== postId,
    );
    writeGuestBlocks(this.#guest);
    for (const [hidden, via] of this.#guestHidden)
      if (via === from || hidden === postId) this.#guestHidden.delete(hidden);
    if (this.#guest.length) await this.#loadGuestHidden();
  }

  /** The Blocked list: by the page each block was made from, newest first */
  async list(): Promise<GalleryBlock[]> {
    if (this.#signedIn) {
      const response = await fetch(BLOCKS);
      if (!response.ok) throw new BlockError('Could not load your blocks.');
      const { blocks, postIds } = (await response.json()) as {
        blocks: GalleryBlock[];
        postIds: number[];
      };
      galleryStars.setBlocked(postIds);
      return blocks;
    }
    this.#guest = readGuestBlocks();
    return this.#guest;
  }
}

export const galleryBlocks = new GalleryBlocksState();

/** The pages blocked while signed out, for the README's Local Storage table */
export const GALLERY_BLOCKS_STORAGE_KEY = STORAGE_KEY;
