// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { browser } from '$app/environment';

/**
 * [pluralize description]
 *
 * @param   {String || Object}  noun    singular noun 'string', or object {singular: 'noun', plural: 'nouns'} of singlular and plural noun
 * @param   {Number}  count   [count description]
 * @param   {String}  suffix  [suffix description]
 *
 * @return  {String}          [return description]
 */
export const pluralize = (
  noun: string | { singular: string; plural: string },
  count: number,
  suffix: string = 's',
): string | undefined => {
  if (typeof noun === 'string') {
    return `${noun}${count !== 1 ? suffix : ''}`;
  } else if (typeof noun === 'object') {
    const { singular, plural } = noun;
    return count !== 1 ? plural : singular;
  }
};

/**
 * Decode html-encoded entities
 *
 * @param   {String}  inputStr  [inputStr description]
 *
 * @return  {String}            [return description]
 */
export const decodeEntity = (inputStr: string): string => {
  if (!browser) return 'inputStr';
  let textarea: HTMLTextAreaElement | null = document.createElement('textarea');
  textarea.innerHTML = inputStr;
  const value = textarea.value;
  textarea = null;
  return value;
};

export const stripHTMLTags = (str: string): string =>
  str.replace(/<[^>]*>/g, '');
