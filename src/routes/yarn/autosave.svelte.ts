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

// Saves changes to the palette open on the Yarn page a moment after editing
// stops, as autosave.svelte.ts does for projects: into the saved palette, which
// syncs when it's the signed-in account's. A palette that isn't saved waits for
// Save Palette, so trying things out doesn't fill My Library. Palettes are
// last-write-wins (see $lib/sync), so there's no conflict to stop for.

import { account } from '#lib/accounts/summary.svelte.js';
import { toast } from '#lib/state/page-state.svelte.js';
import { IDLE_MS, MAX_WAIT_MS } from '#lib/storage/autosave.svelte.js';
import { PaletteStorage } from '#lib/storage/palettes.svelte.js';
import { sync } from '#lib/sync/status.svelte.js';
import type { Color } from '#lib/types/yarn-types.js';
import { colorsToPaletteCode } from '#lib/utils/color-utils.js';

export const paletteAutosave: {
  /** The saved palette that's open, whose changes save by themselves */
  id: string | null;
  /** Whether they save to the signed-in account; otherwise to this browser */
  account: boolean;
  state: 'saved' | 'waiting' | 'saving' | 'error';
  /** Its name; empty for none */
  name: string;
} = $state({ id: null, account: false, state: 'saved', name: '' });

/** The open palette's colors, set by the Yarn page */
let colorsNow: () => Color[] = () => [];
/** Its code as last opened or saved, to tell a real change from none */
let baseline: string | null = null;
/** Its code when last changed, to save before another palette opens */
let lastChange: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let waitingSince = 0;
let saving: Promise<void> | null = null;

export function watchColors(colors: () => Color[]) {
  colorsNow = colors;
}

const codeNow = () => colorsToPaletteCode(colorsNow());

/** Where it saves, and its name, as stored now. Not saved any more: closed. */
async function refresh() {
  const id = paletteAutosave.id;
  if (!id) return;
  const palette = await PaletteStorage.getById(id);
  if (paletteAutosave.id !== id) return;
  if (!palette) {
    closePalette();
    return;
  }
  const owner = PaletteStorage.syncOwner();
  paletteAutosave.account = Boolean(
    owner && sync.active && palette.sync?.ownerUserId === owner,
  );
  paletteAutosave.name = palette.name;
}

/** A saved palette is open now, with the colors on the page */
export async function openPalette(id: string) {
  // Another palette opening (Browse Palettes) over one with a change still
  // waiting: that change is kept first
  const previous = paletteAutosave.id;
  const unsaved = lastChange;
  if (previous && previous !== id && unsaved && unsaved !== baseline)
    await PaletteStorage.updateCode(previous, unsaved).catch(() => false);
  clearTimeout(timer);
  waitingSince = 0;
  paletteAutosave.id = id;
  paletteAutosave.state = 'saved';
  baseline = codeNow();
  lastChange = baseline;
  await refresh();
  // Opened with other colors than it has (Browse Palettes, then an edit
  // before this ran): those are a change to save
  paletteChanged();
}

/** The colors are no longer a saved palette's */
export function closePalette() {
  clearTimeout(timer);
  waitingSince = 0;
  baseline = null;
  lastChange = null;
  paletteAutosave.id = null;
  paletteAutosave.account = false;
  paletteAutosave.state = 'saved';
  paletteAutosave.name = '';
}

/** Opens the saved palette with these colors, if there is one */
export async function openMatchingPalette() {
  const code = codeNow();
  const match = (await PaletteStorage.list()).find((p) => p.code === code);
  if (match && codeNow() === code) await openPalette(match.id);
}

/** Called whenever the colors change */
export function paletteChanged() {
  if (!paletteAutosave.id || baseline === null) return;
  lastChange = codeNow();
  if (lastChange === baseline) {
    // Back to how it was saved, as with Undo
    clearTimeout(timer);
    waitingSince = 0;
    if (paletteAutosave.state === 'waiting') paletteAutosave.state = 'saved';
    return;
  }
  paletteAutosave.state = 'waiting';
  if (!waitingSince) waitingSince = Date.now();
  clearTimeout(timer);
  timer = setTimeout(
    () => void savePaletteNow(),
    Math.min(IDLE_MS, waitingSince + MAX_WAIT_MS - Date.now()),
  );
}

/** Saves a waiting change now, if there is one */
export async function savePaletteNow() {
  clearTimeout(timer);
  if (saving) await saving;
  const id = paletteAutosave.id;
  if (!id || paletteAutosave.state !== 'waiting') return;
  saving = (async () => {
    waitingSince = 0;
    paletteAutosave.state = 'saving';
    const code = codeNow();
    try {
      if (!(await PaletteStorage.updateCode(id, code))) {
        closePalette();
        toast.trigger({
          message:
            'This palette was moved to the Trash or deleted, so changes aren’t being saved. Save Palette to keep them.',
          category: 'warning',
        });
        return;
      }
      if (paletteAutosave.id !== id) return;
      baseline = code;
      // Changes made while saving wait for the next save
      const changedSince = codeNow() !== code;
      paletteAutosave.state = changedSince ? 'waiting' : 'saved';
      if (changedSince)
        timer = setTimeout(() => void savePaletteNow(), IDLE_MS);
    } catch (e) {
      console.warn("Can't save palette", e);
      paletteAutosave.state = 'error';
    }
  })();
  await saving;
  saving = null;
}

/**
 * Saves the colors as a new palette (or finds them already saved), which is
 * then open and saves by itself
 */
export async function saveNewPalette(name = '') {
  const result = await PaletteStorage.add({ code: codeNow(), name });
  await openPalette(result.palette.id);
  return result;
}

/** After a failed save, tries again */
export function retryPaletteSave() {
  if (paletteAutosave.state !== 'error') return;
  paletteAutosave.state = 'waiting';
  void savePaletteNow();
}

/** Names the open palette, or clears its name with an empty string */
export async function renameOpenPalette(name: string) {
  const id = paletteAutosave.id;
  if (!id) return;
  await PaletteStorage.rename(id, name);
  await refresh();
}

/**
 * Adds the open palette, saved only in this browser, to the signed-in account,
 * where it syncs and keeps saving by itself.
 */
export async function addOpenPaletteToAccount() {
  const id = paletteAutosave.id;
  const userId = PaletteStorage.syncOwner();
  if (!id || !userId) return;
  await savePaletteNow();
  const { addToAccount } = await import('#lib/sync/sync.svelte.js');
  await addToAccount(userId, [], [id]);
  await refresh();
}

if (typeof document !== 'undefined') {
  // Leaving the tab: save now, so the change can sync before the tab sleeps
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void savePaletteNow();
  });

  // Signing in or out, sync starting, or a sync bringing in a rename or
  // removal from another device
  $effect.root(() => {
    $effect(() => {
      void sync.active;
      void sync.version;
      void account.summary?.id;
      void refresh();
    });
  });
}
