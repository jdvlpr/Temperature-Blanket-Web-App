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

// A Ravelry project's public notes (markdown) for its gallery page: only
// paragraphs, line breaks, bold, italics and links, as plain segments that
// the page renders as elements. Nothing is ever rendered as HTML.

export type NoteSegment =
  | { type: 'text' | 'bold' | 'italic'; text: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'break' };

const INLINE =
  /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

function inline(line: string): NoteSegment[] {
  const segments: NoteSegment[] = [];
  let last = 0;
  for (const match of line.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last)
      segments.push({ type: 'text', text: line.slice(last, index) });
    const [, label, href, bold1, bold2, italic1, italic2, url] = match;
    if (href) segments.push({ type: 'link', text: label, href });
    else if (bold1 ?? bold2)
      segments.push({ type: 'bold', text: (bold1 ?? bold2)! });
    else if (italic1 ?? italic2)
      segments.push({ type: 'italic', text: (italic1 ?? italic2)! });
    else if (url) segments.push({ type: 'link', text: url, href: url });
    last = index + match[0].length;
  }
  if (last < line.length)
    segments.push({ type: 'text', text: line.slice(last) });
  return segments;
}

/** Paragraphs of segments; headings and list marks show as plain text. */
export function parseNotes(notes: string | null | undefined): NoteSegment[][] {
  return (notes ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => line.replace(/^\s{0,3}(#{1,6}\s+|>\s?)/, '').trimEnd())
        .filter((line) => line.trim()),
    )
    .filter((lines) => lines.length)
    .map((lines) =>
      lines.flatMap((line, i) => [
        ...(i ? [{ type: 'break' } as const] : []),
        ...inline(line),
      ]),
    );
}
