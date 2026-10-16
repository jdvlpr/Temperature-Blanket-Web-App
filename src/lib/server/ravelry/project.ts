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

// What's sent to Ravelry for a saved project: checked here, from what the
// browser asks for, so a request can only describe its own project.

import type {
  RavelryPackPost,
  RavelryProject,
  RavelryProjectPost,
} from './api';

/** The line in a Ravelry project's public notes that links back here. */
export const LINK_LINE_START = 'Planned with [Temperature Blanket](';

/**
 * The markdown link line. Brackets are encoded, since Ravelry's markdown ends a
 * link at the first ")" (old links to a project held "(10'20)" ranges).
 */
export const linkLine = (url: string) =>
  `${LINK_LINE_START}${url.replaceAll('(', '%28').replaceAll(')', '%29')})`;

const isLinkLine = (line: string) =>
  line.trimStart().startsWith(LINK_LINE_START);

/**
 * The notes with the link line replaced, the whole line however broken it is
 * (or, without one, added at the end), leaving the rest as the person wrote it.
 */
export function withLinkLine(notes: string | null | undefined, url: string) {
  const lines = (notes ?? '').split('\n');
  const index = lines.findIndex(isLinkLine);
  if (index >= 0) {
    lines[index] = linkLine(url);
    return lines.join('\n');
  }
  const text = (notes ?? '').trimEnd();
  return text ? `${text}\n\n${linkLine(url)}` : linkLine(url);
}

/** The notes as the person wrote them: without the link line and the blank lines around it. */
export function withoutLinkLine(notes: string | null | undefined) {
  return (notes ?? '')
    .split('\n')
    .filter((line) => !isLinkLine(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type ProjectYarn = {
  /** A Ravelry database yarn, when the person confirmed one */
  ravelryYarnId?: number;
  /** "Brand Yarn", shown when it isn't linked to a Ravelry yarn */
  name: string;
  colorway: string;
};

/**
 * What the browser asks to post or change. On an update, only the fields sent
 * change on Ravelry, so the rest stays as it is there; null clears a date.
 */
export type ProjectPost = {
  name?: string;
  craftId?: number | null;
  statusId?: number | null;
  started?: string | null;
  finishBy?: string | null;
  completed?: string | null;
  progress?: number | null;
  /** The notes above the link line, which is always kept */
  notes?: string;
  /** Posting: one pack per color */
  yarns?: ProjectYarn[];
  /** Updating: yarns to add, and packs this app added to remove */
  packs?: { add: ProjectYarn[]; remove: number[] };
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME = 100;
const MAX_NOTES = 5000;
const MAX_YARNS = 60;
const MAX_YARN_TEXT = 200;

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
const id = (value: unknown) =>
  Number.isSafeInteger(value) && (value as number) > 0
    ? (value as number)
    : null;
const date = (value: unknown) =>
  typeof value === 'string' && DATE.test(value) ? value : null;

function readYarns(value: unknown): ProjectYarn[] {
  const yarns = Array.isArray(value) ? value.slice(0, MAX_YARNS) : [];
  return yarns.flatMap((y) => {
    if (!y || typeof y !== 'object') return [];
    const yarn = y as Record<string, unknown>;
    const name = text(yarn.name, MAX_YARN_TEXT);
    const colorway = text(yarn.colorway, MAX_YARN_TEXT);
    if (!name && !colorway) return [];
    const ravelryYarnId = id(yarn.ravelryYarnId);
    return [{ name, colorway, ...(ravelryYarnId ? { ravelryYarnId } : {}) }];
  });
}

/** The request as a ProjectPost, or what's wrong with it. A new post needs a name. */
export function readProjectPost(
  body: unknown,
  { create }: { create: boolean },
): ProjectPost | string {
  if (!body || typeof body !== 'object') return 'Expected a JSON object';
  const b = body as Record<string, unknown>;
  const has = (key: string) => key in b;
  const post: ProjectPost = {};

  if (has('name') || create) {
    post.name = text(b.name, MAX_NAME);
    if (!post.name) return 'A name is needed';
  }
  if (has('craftId')) post.craftId = id(b.craftId);
  if (has('statusId')) post.statusId = id(b.statusId);
  if (has('started')) post.started = date(b.started);
  if (has('finishBy')) post.finishBy = date(b.finishBy);
  if (has('completed')) post.completed = date(b.completed);
  if (has('progress'))
    post.progress =
      typeof b.progress === 'number' && Number.isFinite(b.progress)
        ? Math.min(100, Math.max(0, Math.round(b.progress)))
        : null;
  if (has('notes')) post.notes = text(b.notes, MAX_NOTES);
  if (create) post.yarns = readYarns(b.yarns);
  else if (b.packs && typeof b.packs === 'object') {
    const packs = b.packs as Record<string, unknown>;
    post.packs = {
      add: readYarns(packs.add),
      remove: (Array.isArray(packs.remove) ? packs.remove : [])
        .map(id)
        .filter((n): n is number => n !== null)
        .slice(0, MAX_YARNS),
    };
  }
  return post;
}

/** A pack (yarn on Ravelry): linked to Ravelry's yarn when confirmed. */
export const packFor = (yarn: ProjectYarn): RavelryPackPost =>
  yarn.ravelryYarnId
    ? { yarn_id: yarn.ravelryYarnId, colorway: yarn.colorway || null }
    : { personal_name: yarn.name || null, colorway: yarn.colorway || null };

/** One pack per color. */
export const packsFor = (yarns: ProjectYarn[]) => yarns.map(packFor);

/** A new Ravelry project, with its yarns and the link line. */
export function createData(
  post: ProjectPost,
  link: string,
): RavelryProjectPost {
  return {
    name: post.name,
    craft_id: post.craftId ?? null,
    project_status_id: post.statusId ?? null,
    started: post.started ?? null,
    finish_by: post.finishBy ?? null,
    ...(post.completed ? { completed: post.completed } : {}),
    ...(post.progress != null ? { progress: post.progress } : {}),
    notes: withLinkLine(post.notes, link),
    tag_names: ['temperature-blanket'],
    packs: packsFor(post.yarns ?? []),
  };
}

/**
 * Changes for a linked project: only the fields sent that differ from Ravelry,
 * and the notes whenever the link line needs fixing. Empty when nothing changed.
 */
export function updateData(
  post: ProjectPost,
  link: string,
  current: RavelryProject,
): Omit<RavelryProjectPost, 'packs'> {
  const data: Omit<RavelryProjectPost, 'packs'> = {};
  const set = <K extends keyof typeof data>(
    key: K,
    value: (typeof data)[K] | undefined,
    now: unknown,
  ) => {
    if (value !== undefined && value !== (now ?? null)) data[key] = value;
  };
  set('name', post.name, current.name);
  set('craft_id', post.craftId, current.craft_id);
  set('project_status_id', post.statusId, current.project_status_id);
  set('started', post.started, current.started);
  set('finish_by', post.finishBy, current.finish_by);
  set('completed', post.completed, current.completed);
  set('progress', post.progress, current.progress);
  const notes = withLinkLine(
    post.notes ?? withoutLinkLine(current.notes),
    link,
  );
  if (notes !== (current.notes ?? '')) data.notes = notes;
  return data;
}

/** A yarn as the app knows it, to tell which are already on Ravelry. */
export const yarnKey = (yarn: {
  name?: string | null;
  colorway?: string | null;
}) =>
  `${(yarn.name ?? '').trim().toLowerCase()}|${(yarn.colorway ?? '').trim().toLowerCase()}`;
