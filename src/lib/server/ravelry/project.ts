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

import type { RavelryPackPost, RavelryProjectPost } from './api';

/** The line in a Ravelry project's public notes that links back here. */
export const LINK_LINE_START = 'Planned with [Temperature Blanket](';

export const linkLine = (url: string) => `${LINK_LINE_START}${url})`;

/**
 * The notes with the link line replaced (or, without one, added at the end),
 * leaving the rest as the person wrote it on Ravelry.
 */
export function withLinkLine(notes: string | null | undefined, url: string) {
  const lines = (notes ?? '').split('\n');
  const index = lines.findIndex((line) => line.startsWith(LINK_LINE_START));
  if (index >= 0) {
    lines[index] = linkLine(url);
    return lines.join('\n');
  }
  const text = (notes ?? '').trimEnd();
  return text ? `${text}\n\n${linkLine(url)}` : linkLine(url);
}

export type ProjectYarn = {
  /** A Ravelry database yarn, when the person confirmed one */
  ravelryYarnId?: number;
  /** "Brand Yarn", shown when it isn't linked to a Ravelry yarn */
  name: string;
  colorway: string;
};

export type ProjectPost = {
  name: string;
  craftId: number | null;
  statusId: number | null;
  started: string | null;
  finishBy: string | null;
  /** The project's link here, for the link line */
  link: string;
  /** Notes written in the dialog, above the link line (posting only) */
  notes: string;
  yarns: ProjectYarn[];
  /** On update, which of these to change on Ravelry; the link line always is */
  update: { name: boolean; dates: boolean; status: boolean; notes: boolean };
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

/**
 * The request as a ProjectPost, or what's wrong with it. `origin` is this
 * site's: the link line may only point here, at this project.
 */
export function readProjectPost(
  body: unknown,
  origin: string,
  projectId: string,
): ProjectPost | string {
  if (!body || typeof body !== 'object') return 'Expected a JSON object';
  const b = body as Record<string, unknown>;

  const name = text(b.name, MAX_NAME);
  if (!name) return 'A name is needed';

  let link: URL;
  try {
    link = new URL(String(b.link));
  } catch {
    return 'The project link is missing';
  }
  if (link.origin !== origin || link.searchParams.get('project') !== projectId)
    return 'The link must be this project’s';

  const yarns = Array.isArray(b.yarns) ? b.yarns.slice(0, MAX_YARNS) : [];
  const update = (b.update ?? {}) as Record<string, unknown>;

  return {
    name,
    craftId: id(b.craftId),
    statusId: id(b.statusId),
    started: date(b.started),
    finishBy: date(b.finishBy),
    link: link.href,
    notes: text(b.notes, MAX_NOTES),
    yarns: yarns.flatMap((y) => {
      if (!y || typeof y !== 'object') return [];
      const yarn = y as Record<string, unknown>;
      const name = text(yarn.name, MAX_YARN_TEXT);
      const colorway = text(yarn.colorway, MAX_YARN_TEXT);
      if (!name && !colorway) return [];
      const ravelryYarnId = id(yarn.ravelryYarnId);
      return [{ name, colorway, ...(ravelryYarnId ? { ravelryYarnId } : {}) }];
    }),
    update: {
      name: update.name === true,
      dates: update.dates === true,
      status: update.status === true,
      notes: update.notes === true,
    },
  };
}

/** One pack (yarn on Ravelry) per color: linked to Ravelry's yarn when confirmed. */
export function packsFor(yarns: ProjectYarn[]): RavelryPackPost[] {
  return yarns.map((yarn) =>
    yarn.ravelryYarnId
      ? { yarn_id: yarn.ravelryYarnId, colorway: yarn.colorway || null }
      : { personal_name: yarn.name || null, colorway: yarn.colorway || null },
  );
}

/** A new Ravelry project, with its yarns and the link line. */
export function createData(post: ProjectPost): RavelryProjectPost {
  return {
    name: post.name,
    craft_id: post.craftId,
    project_status_id: post.statusId,
    started: post.started,
    finish_by: post.finishBy,
    notes: post.notes
      ? `${post.notes}\n\n${linkLine(post.link)}`
      : linkLine(post.link),
    tag_names: ['temperature-blanket'],
    packs: packsFor(post.yarns),
  };
}

/**
 * Changes for a linked project: the link line always, the rest only as ticked,
 * so what was edited on Ravelry stays.
 */
export function updateData(
  post: ProjectPost,
  currentNotes: string | null | undefined,
): Omit<RavelryProjectPost, 'packs'> {
  const notesBase = post.update.notes ? post.notes : currentNotes;
  return {
    notes: withLinkLine(notesBase, post.link),
    ...(post.update.name ? { name: post.name } : {}),
    ...(post.update.dates
      ? { started: post.started, finish_by: post.finishBy }
      : {}),
    ...(post.update.status ? { project_status_id: post.statusId } : {}),
  };
}
