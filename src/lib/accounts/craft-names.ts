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

// A friendly display name for a new account, like "Cozy Purl 27", so nobody's
// real name is shown on a gallery page unless they choose it. Kept free of
// SvelteKit imports: the server's auth options use it. Names needn't be
// unique; gallery pages find their owner by ID, not by name.

const ADJECTIVES = [
  'Amber',
  'Autumn',
  'Breezy',
  'Bright',
  'Cheery',
  'Clever',
  'Cloudy',
  'Cozy',
  'Dewy',
  'Frosty',
  'Fuzzy',
  'Gentle',
  'Golden',
  'Happy',
  'Hazel',
  'Heather',
  'Juniper',
  'Lilac',
  'Lucky',
  'Maple',
  'Meadow',
  'Merry',
  'Misty',
  'Mossy',
  'Plucky',
  'Quiet',
  'Rainy',
  'Rosy',
  'Saffron',
  'Snowy',
  'Spring',
  'Starry',
  'Summer',
  'Sunny',
  'Toasty',
  'Twilight',
  'Velvet',
  'Willow',
  'Winter',
  'Woolly',
];

const NOUNS = [
  'Acorn',
  'Alpaca',
  'Blanket',
  'Bluebell',
  'Bobble',
  'Bramble',
  'Bunny',
  'Button',
  'Cable',
  'Clover',
  'Daisy',
  'Fern',
  'Finch',
  'Fox',
  'Hedgehog',
  'Lamb',
  'Loop',
  'Mitten',
  'Needle',
  'Otter',
  'Owl',
  'Pebble',
  'Pinecone',
  'Pompom',
  'Puffin',
  'Purl',
  'Ribbon',
  'Robin',
  'Scarf',
  'Skein',
  'Sparrow',
  'Sprout',
  'Stitch',
  'Sweater',
  'Tassel',
  'Teacup',
  'Thistle',
  'Wren',
  'Yarn',
];

const pick = <T>(list: T[], random: () => number) =>
  list[Math.floor(random() * list.length)];

/** "Cozy Purl 27": a word for a feeling, a yarny or outdoorsy thing, 10–99 */
export function randomCraftName(random: () => number = Math.random): string {
  const number = 10 + Math.floor(random() * 90);
  return `${pick(ADJECTIVES, random)} ${pick(NOUNS, random)} ${number}`;
}
