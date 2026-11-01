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

// The PDF's pages as pictures, for the Download PDF dialog's preview: the
// very file that would download, drawn page by page by pdf.js (loaded only
// here, the first time a preview is drawn).

let pdfjs: Promise<typeof import('pdfjs-dist')> | undefined;

function loadPdfJs() {
  pdfjs ??= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjs;
}

export type PreviewPage = {
  /** The page as a PNG, an object URL: let it go with revokePages */
  url: string;
  /** Its size in PDF points, for its shape */
  width: number;
  height: number;
};

export function revokePages(pages: PreviewPage[]) {
  for (const page of pages) URL.revokeObjectURL(page.url);
}

/**
 * Draws each page `width` CSS pixels wide (sharp on this screen). Gives up,
 * returning null, as soon as `cancelled()` (a newer preview was asked for).
 */
export async function renderPages(
  data: ArrayBuffer,
  width: number,
  cancelled: () => boolean,
): Promise<PreviewPage[] | null> {
  const lib = await loadPdfJs();
  const task = lib.getDocument({ data });
  const pages: PreviewPage[] = [];
  try {
    const doc = await task.promise;
    for (let n = 1; n <= doc.numPages; n++) {
      if (cancelled()) break;
      const page = await doc.getPage(n);
      const size = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: (width * Math.min(window.devicePixelRatio, 2)) / size.width,
      });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve),
      );
      if (blob)
        pages.push({
          url: URL.createObjectURL(blob),
          width: size.width,
          height: size.height,
        });
    }
  } finally {
    await task.destroy();
  }
  if (cancelled()) {
    revokePages(pages);
    return null;
  }
  return pages;
}
