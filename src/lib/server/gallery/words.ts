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

// A small filter on the names shown in the gallery (App Store guideline 1.2):
// project and palette names when they're published, updated or renamed, and
// the publisher's display name. Whole words only, ignoring case and common
// look-alike characters, so "Scunthorpe" and "Essex" are fine. It catches the
// obvious; reports (/gallery/reports) catch the rest.

/** Answered (400 NAME_NOT_ALLOWED) when a name has a word on the list */
export const NAME_NOT_ALLOWED = 'Please choose a different name.';

// Slurs and strong profanity. Each also matches with an "s", "es", "ed",
// "er", "ers" or "ing" after it.
const WORDS = [
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'chink',
  'cock',
  'cocksucker',
  'cunt',
  'dickhead',
  'fag',
  'faggot',
  'fuck',
  'fucker',
  'fucking',
  'gook',
  'kike',
  'motherfucker',
  'nazi',
  'nigga',
  'nigger',
  'paki',
  'porn',
  'pussy',
  'raghead',
  'rape',
  'retard',
  'shit',
  'shitty',
  'slut',
  'spic',
  'tranny',
  'twat',
  'wetback',
  'whore',
];

const ENDINGS = ['', 's', 'es', 'ed', 'er', 'ers', 'ing'];

const BLOCKED = new Set(
  WORDS.flatMap((word) => ENDINGS.map((ending) => word + ending)),
);

// Look-alikes people use to slip past a filter
const LOOK_ALIKES: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
  '!': 'i',
};

/** The words of a name, lowercased, accents and look-alikes undone */
function wordsOf(text: string): string[] {
  const plain = text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[0134579@$!]/g, (c) => LOOK_ALIKES[c] ?? c);
  // Dots, dashes and the like between letters ("f.u.c.k", "f-u-c-k") join them
  const joined = plain.replace(/(?<=\p{L})[._*-](?=\p{L})/gu, '');
  return joined.split(/[^\p{L}]+/u).filter(Boolean);
}

/** Whether a name is fine to show in the gallery */
export function nameAllowed(text: string | null | undefined): boolean {
  if (!text) return true;
  return !wordsOf(text).some((word) => BLOCKED.has(word));
}
