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

/**
 * A card's picture takes the card's corners (less its padding, as the yarn
 * palette's colors do, `rounded-nested`) wherever it reaches them, and stays
 * square-cornered where it doesn't (a picture in the middle of a wide card).
 * Its size varies, so it's measured.
 */

import type { Attachment } from 'svelte/attachments';

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Corners {
  tl: boolean;
  tr: boolean;
  br: boolean;
  bl: boolean;
}

/** How far (px) from the card's padding a picture still counts as reaching it */
export const NEAR_TOLERANCE = 4;

/** Which of the picture's corners reach the card's inside (its padding box):
 * both of a corner's sides within `tolerance` of it */
export function nearCorners(
  inner: Box,
  picture: Box,
  tolerance = NEAR_TOLERANCE,
): Corners {
  const top = picture.top - inner.top <= tolerance;
  const left = picture.left - inner.left <= tolerance;
  const right = inner.right - picture.right <= tolerance;
  const bottom = inner.bottom - picture.bottom <= tolerance;
  return {
    tl: top && left,
    tr: top && right,
    br: bottom && right,
    bl: bottom && left,
  };
}

/** The picture as drawn inside its element's box: with `object-fit: contain`,
 * smaller than the box on two sides (centered, as by default) */
export function drawnBox(
  box: Box,
  fit: string,
  naturalWidth: number,
  naturalHeight: number,
): Box {
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  if (fit !== 'contain' || !naturalWidth || !naturalHeight || !width || !height)
    return box;
  const scale = Math.min(width / naturalWidth, height / naturalHeight);
  const drawnWidth = naturalWidth * scale;
  const drawnHeight = naturalHeight * scale;
  const left = box.left + (width - drawnWidth) / 2;
  const top = box.top + (height - drawnHeight) / 2;
  return {
    left,
    top,
    right: left + drawnWidth,
    bottom: top + drawnHeight,
  };
}

/** The radius each corner takes (top-left, top-right, bottom-right, bottom-left) */
export function cornerRadius(corners: Corners): string {
  const radius = (near: boolean) => (near ? 'var(--radius-nested)' : '0');
  return [corners.tl, corners.tr, corners.br, corners.bl].map(radius).join(' ');
}

/** On a card's picture (inside an element with `data-card`): its corners
 * follow the card's wherever it reaches them, measured again when either
 * changes size or the picture loads */
export const cardCorners: Attachment<HTMLImageElement> = (img) => {
  const card = img.closest<HTMLElement>('[data-card]');
  if (!card) return;

  const measure = () => {
    const cardRect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const px = (value: string) => parseFloat(value) || 0;
    const inner: Box = {
      left: cardRect.left + px(style.borderLeftWidth) + px(style.paddingLeft),
      top: cardRect.top + px(style.borderTopWidth) + px(style.paddingTop),
      right:
        cardRect.right - px(style.borderRightWidth) - px(style.paddingRight),
      bottom:
        cardRect.bottom - px(style.borderBottomWidth) - px(style.paddingBottom),
    };
    const picture = drawnBox(
      img.getBoundingClientRect(),
      getComputedStyle(img).objectFit,
      img.naturalWidth,
      img.naturalHeight,
    );
    img.style.borderRadius = cornerRadius(nearCorners(inner, picture));
  };

  const observer = new ResizeObserver(measure);
  observer.observe(card);
  observer.observe(img);
  img.addEventListener('load', measure);
  measure();
  return () => {
    observer.disconnect();
    img.removeEventListener('load', measure);
    img.style.borderRadius = '';
  };
};
