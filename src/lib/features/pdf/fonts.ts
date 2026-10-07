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

// The site's font in the PDF: Be Vietnam Pro (SIL Open Font License, see
// static/fonts/pdf/OFL.txt). jsPDF's built-in fonts only know Western
// European letters, so accented yarn and place names and the minus sign
// need it. Loaded when a PDF is made, once per visit.

import type { jsPDF } from 'jspdf';

export const APP_FONT = 'BeVietnamPro';

const FILES = {
  normal: 'BeVietnamPro-Regular.ttf',
  bold: 'BeVietnamPro-SemiBold.ttf',
} as const;

let loading: Promise<Record<keyof typeof FILES, string>> | null = null;

async function toBase64(response: Response): Promise<string> {
  if (!response.ok) throw new Error(`Font: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  // In pieces: one call with every byte is too many arguments
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function load() {
  loading ??= Promise.all(
    Object.values(FILES).map((file) =>
      fetch(`/fonts/pdf/${file}`).then(toBase64),
    ),
  )
    .then(([normal, bold]) => ({ normal, bold }))
    .catch((error) => {
      loading = null;
      throw error;
    });
  return loading;
}

/** Add the site's font to a PDF; its name, or Helvetica's if it can't load */
export async function addAppFont(doc: jsPDF): Promise<string> {
  try {
    const data = await load();
    for (const style of ['normal', 'bold'] as const) {
      doc.addFileToVFS(FILES[style], data[style]);
      doc.addFont(FILES[style], APP_FONT, style);
    }
    return APP_FONT;
  } catch (error) {
    console.warn("Can't load the PDF font; using Helvetica", error);
    return 'helvetica';
  }
}
