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

/** A photo for "Random Photo": a Picsum id and its Unsplash credit */
export type RandomPhoto = { id: number; author: string; url: string };

// Colorful photos from Picsum (https://picsum.photos), which serves photos from
// Unsplash under the Unsplash License. Picked by hand from the full catalog for
// varied, saturated colors that make good palettes.
export const RANDOM_PHOTOS: RandomPhoto[] = [
  {
    id: 10,
    author: 'Paul Jarvis',
    url: 'https://unsplash.com/photos/6J--NXulQCs',
  },
  {
    id: 17,
    author: 'Paul Jarvis',
    url: 'https://unsplash.com/photos/Ven2CV8IJ5A',
  },
  {
    id: 18,
    author: 'Paul Jarvis',
    url: 'https://unsplash.com/photos/Ps2n0rShqaM',
  },
  {
    id: 19,
    author: 'Paul Jarvis',
    url: 'https://unsplash.com/photos/P7Lh0usGcuk',
  },
  {
    id: 21,
    author: 'Alejandro Escamilla',
    url: 'https://unsplash.com/photos/jVb0mSn0LbE',
  },
  {
    id: 27,
    author: 'Yoni Kaplan-Nadel',
    url: 'https://unsplash.com/photos/iJnZwLBOB1I',
  },
  {
    id: 28,
    author: 'Jerry Adney',
    url: 'https://unsplash.com/photos/_WiFMBRT7Aw',
  },
  {
    id: 34,
    author: 'Aleks Dorohovich',
    url: 'https://unsplash.com/photos/zZvsEMPxjIA',
  },
  {
    id: 35,
    author: 'Shane Colella',
    url: 'https://unsplash.com/photos/znM0ujn2RUA',
  },
  {
    id: 45,
    author: 'Alan Haverty',
    url: 'https://unsplash.com/photos/-XA-fTYYfV0',
  },
  {
    id: 46,
    author: 'Jeffrey Kam',
    url: 'https://unsplash.com/photos/Nzw3HHsNHYU',
  },
  {
    id: 54,
    author: 'Nicholas Swanson',
    url: 'https://unsplash.com/photos/d19by2PLaPc',
  },
  {
    id: 55,
    author: 'Tyler Wanlass',
    url: 'https://unsplash.com/photos/akbHiqZy4Pg',
  },
  {
    id: 56,
    author: 'Sebastian Muller',
    url: 'https://unsplash.com/photos/VLdaxYyXJvw',
  },
  {
    id: 63,
    author: 'Justin Leibow',
    url: 'https://unsplash.com/photos/ZJsseAxEcqM',
  },
  {
    id: 64,
    author: 'Alexander Shustov',
    url: 'https://unsplash.com/photos/AHBiSKaENwc',
  },
  {
    id: 65,
    author: 'Alexander Shustov',
    url: 'https://unsplash.com/photos/2FrX56QL7P8',
  },
  {
    id: 74,
    author: 'Isaak Dury',
    url: 'https://unsplash.com/photos/YhZbnxqtooM',
  },
  {
    id: 76,
    author: 'Alexander Shustov',
    url: 'https://unsplash.com/photos/OxzhYtL-00Y',
  },
  {
    id: 82,
    author: 'Rula Sibai',
    url: 'https://unsplash.com/photos/-vq7mi4oF0s',
  },
  {
    id: 85,
    author: 'Gozha Net',
    url: 'https://unsplash.com/photos/xDrxJCdedcI',
  },
  {
    id: 90,
    author: 'Rula Sibai',
    url: 'https://unsplash.com/photos/qVj3KuEikvg',
  },
  {
    id: 92,
    author: 'Rafael Souza',
    url: 'https://unsplash.com/photos/QxkBP3A9XmU',
  },
  {
    id: 102,
    author: 'Ben Moore',
    url: 'https://unsplash.com/photos/pJILiyPdrXI',
  },
  {
    id: 103,
    author: 'Ilham Rahmansyah',
    url: 'https://unsplash.com/photos/DwTZwZYi9Ww',
  },
  {
    id: 106,
    author: 'Arvee Marie',
    url: 'https://unsplash.com/photos/YnfGtpt2gf4',
  },
  { id: 112, author: 'Zugr', url: 'https://unsplash.com/photos/kmF_Aq8gkp0' },
  {
    id: 132,
    author: 'Peter Besser',
    url: 'https://unsplash.com/photos/gq4kE8KRP8c',
  },
  {
    id: 133,
    author: 'Dietmar Becker',
    url: 'https://unsplash.com/photos/8Zt0xOOK4nI',
  },
  {
    id: 152,
    author: 'Steven Spassov',
    url: 'https://unsplash.com/photos/tVIqMgGlAG0',
  },
  {
    id: 155,
    author: 'Christopher Sardegna',
    url: 'https://unsplash.com/photos/4f7r1LuPYj8',
  },
  {
    id: 158,
    author: 'Daniel Robert',
    url: 'https://unsplash.com/photos/MRxD-J9-4ps',
  },
  {
    id: 161,
    author: 'Chloe Benko-Prieur',
    url: 'https://unsplash.com/photos/ti4uz330CwU',
  },
  {
    id: 162,
    author: 'Dillon McIntosh',
    url: 'https://unsplash.com/photos/SlGVAKyP20U',
  },
  {
    id: 163,
    author: 'Linh Nguyen',
    url: 'https://unsplash.com/photos/oFAVqfTSby8',
  },
  {
    id: 164,
    author: 'Linh Nguyen',
    url: 'https://unsplash.com/photos/agkblvPff5U',
  },
  {
    id: 165,
    author: 'Linh Nguyen',
    url: 'https://unsplash.com/photos/xjXz8GKXcTI',
  },
  {
    id: 167,
    author: 'petradr',
    url: 'https://unsplash.com/photos/WqK_xV_hbug',
  },
  {
    id: 169,
    author: 'Noel Lopez',
    url: 'https://unsplash.com/photos/BjelfpszQDw',
  },
  {
    id: 173,
    author: 'Linh Nguyen',
    url: 'https://unsplash.com/photos/J8k-gzI0Zy0',
  },
  {
    id: 176,
    author: 'Good Free Photos',
    url: 'https://unsplash.com/photos/WO4bxwzHRe8',
  },
  {
    id: 180,
    author: 'Galymzhan Abdugalimov',
    url: 'https://unsplash.com/photos/ICW6QYOcdlg',
  },
  {
    id: 197,
    author: 'Kholodnitskiy Maksim',
    url: 'https://unsplash.com/photos/n6TWNDfyPwk',
  },
  {
    id: 202,
    author: 'Glen Carrie',
    url: 'https://unsplash.com/photos/xlAmGyZE7Zg',
  },
  {
    id: 206,
    author: 'Philipp Reiner',
    url: 'https://unsplash.com/photos/qPJ6eRAMmCM',
  },
  {
    id: 211,
    author: 'Martin Wessely',
    url: 'https://unsplash.com/photos/GDvSktiPIQQ',
  },
  {
    id: 220,
    author: 'Robin R\u00f6cker',
    url: 'https://unsplash.com/photos/qUToqliACNA',
  },
  {
    id: 223,
    author: 'Maria Carrasco',
    url: 'https://unsplash.com/photos/vwY2D2Wr4ME',
  },
  { id: 225, author: 'Vee O', url: 'https://unsplash.com/photos/hGO27G5tZJ8' },
  {
    id: 247,
    author: 'Georgia Dixon',
    url: 'https://unsplash.com/photos/wuHPFRWtDLI',
  },
  {
    id: 271,
    author: 'Fr\u00e9 Sonneveld',
    url: 'https://unsplash.com/photos/Bpb6yvtkpEY',
  },
  {
    id: 274,
    author: 'Wojtek Witkowski',
    url: 'https://unsplash.com/photos/h7rOzTmGxWE',
  },
  {
    id: 287,
    author: 'Aleksandra Boguslawska',
    url: 'https://unsplash.com/photos/c54ZhWDLEDo',
  },
  {
    id: 289,
    author: 'Jennifer Langley',
    url: 'https://unsplash.com/photos/vIqxsp0_p1g',
  },
  {
    id: 292,
    author: 'Webvilla',
    url: 'https://unsplash.com/photos/hv1MrBzGGNY',
  },
  {
    id: 308,
    author: 'Charles L.',
    url: 'https://unsplash.com/photos/5z8CIELxW1Y',
  },
  {
    id: 309,
    author: 'Ben Moore',
    url: 'https://unsplash.com/photos/qjs4WqT8Ib0',
  },
  {
    id: 319,
    author: 'Kristian Karlsson',
    url: 'https://unsplash.com/photos/3V6ZTpZS-ag',
  },
  {
    id: 323,
    author: 'Pawe\u0142 Wojciechowski',
    url: 'https://unsplash.com/photos/QYAojSRu82c',
  },
  {
    id: 327,
    author: 'Ryan Schroeder',
    url: 'https://unsplash.com/photos/Gg7uKdHFb_c',
  },
  {
    id: 328,
    author: 'Nathalie Gouz\u00e9e',
    url: 'https://unsplash.com/photos/hSeq6sn2HeE',
  },
  {
    id: 360,
    author: 'Cas Cornelissen',
    url: 'https://unsplash.com/photos/G2UTNecskWg',
  },
  {
    id: 369,
    author: 'Lou Levit',
    url: 'https://unsplash.com/photos/umcc42T8fD4',
  },
  {
    id: 376,
    author: 'Andrew Ruiz',
    url: 'https://unsplash.com/photos/bI2j1olMXUA',
  },
  {
    id: 389,
    author: 'Jake Hills',
    url: 'https://unsplash.com/photos/bt-Sc22W-BE',
  },
  {
    id: 401,
    author: 'Austin Ban',
    url: 'https://unsplash.com/photos/0fjGQmYCRW8',
  },
  { id: 402, author: 'Loudge', url: 'https://unsplash.com/photos/VfIYjO8P_24' },
  {
    id: 428,
    author: 'Thong Vo',
    url: 'https://unsplash.com/photos/ZLmSzOPoUno',
  },
  {
    id: 429,
    author: 'Glen Carrie',
    url: 'https://unsplash.com/photos/FjjUVn_KHLU',
  },
  {
    id: 437,
    author: 'Bonnie Meisels',
    url: 'https://unsplash.com/photos/Y5uyOoct2pg',
  },
  {
    id: 487,
    author: 'Nigel Lo',
    url: 'https://unsplash.com/photos/PpDoE1f00KY',
  },
  {
    id: 493,
    author: 'Jeffrey Deng',
    url: 'https://unsplash.com/photos/h6t2dbYgDuc',
  },
  {
    id: 501,
    author: 'davide ragusa',
    url: 'https://unsplash.com/photos/QbDkhVZ80To',
  },
  {
    id: 503,
    author: 'Ramiro Checchi',
    url: 'https://unsplash.com/photos/BpN4qo98j-Y',
  },
  {
    id: 517,
    author: 'Brian Jimenez',
    url: 'https://unsplash.com/photos/ch-mPpglKjQ',
  },
  {
    id: 520,
    author: 'Dorothee H\u00fcbner',
    url: 'https://unsplash.com/photos/4vPPtrfLRcs',
  },
  {
    id: 521,
    author: 'Christian Holzinger',
    url: 'https://unsplash.com/photos/lqQlmcPt9Qg',
  },
  {
    id: 525,
    author: 'Luca Zanon',
    url: 'https://unsplash.com/photos/aViOQZzikVs',
  },
  {
    id: 526,
    author: 'Jeff Sheldon',
    url: 'https://unsplash.com/photos/9SyOKYrq-rE',
  },
  {
    id: 535,
    author: 'Jeff Sheldon',
    url: 'https://unsplash.com/photos/Lj1S1_KD61k',
  },
  {
    id: 549,
    author: 'Artur Pokusin',
    url: 'https://unsplash.com/photos/paNkUbhQj3Q',
  },
  {
    id: 553,
    author: 'Rula Sibai',
    url: 'https://unsplash.com/photos/nIkuMWT4Imc',
  },
  {
    id: 564,
    author: 'Sebastian Boguszewicz',
    url: 'https://unsplash.com/photos/YG_Fxyqz9xg',
  },
  {
    id: 581,
    author: 'Lance Anderson',
    url: 'https://unsplash.com/photos/2Q8zDWkj0Yw',
  },
  {
    id: 585,
    author: 'Abigail  Keenan',
    url: 'https://unsplash.com/photos/5Xs09ljJhlw',
  },
  {
    id: 617,
    author: 'Ksenia Kudelkina',
    url: 'https://unsplash.com/photos/o5_LYQ44gsM',
  },
  {
    id: 619,
    author: 'Davey Heuser',
    url: 'https://unsplash.com/photos/ZXqE31D8TEk',
  },
  { id: 639, author: 'Ilya', url: 'https://unsplash.com/photos/D62hQefhteg' },
  {
    id: 655,
    author: 'Kyle Szegedi',
    url: 'https://unsplash.com/photos/tRQfEwP5P_0',
  },
  {
    id: 667,
    author: 'Joshua Sortino',
    url: 'https://unsplash.com/photos/XMcoTHgNcQA',
  },
  {
    id: 678,
    author: 'Samuel Zeller',
    url: 'https://unsplash.com/photos/YN_JWPDYVoM',
  },
  {
    id: 686,
    author: 'Harvey Enrile',
    url: 'https://unsplash.com/photos/FQ_DGG-8OcY',
  },
  {
    id: 695,
    author: 'Jordan McQueen',
    url: 'https://unsplash.com/photos/1vsFPX_DLTM',
  },
  {
    id: 696,
    author: 'Leigh Kendell',
    url: 'https://unsplash.com/photos/-So60UAgCtU',
  },
  {
    id: 699,
    author: 'Biegun Wschodni',
    url: 'https://unsplash.com/photos/vD3L-rN_qNw',
  },
  {
    id: 701,
    author: 'Shannon Richards',
    url: 'https://unsplash.com/photos/jJzmexjwfGE',
  },
  {
    id: 702,
    author: 'Dominik Schr\u00f6der',
    url: 'https://unsplash.com/photos/9PCmMdc4Crw',
  },
  {
    id: 703,
    author: 'Alyssa Smith',
    url: 'https://unsplash.com/photos/xNZHQn6lyLk',
  },
  {
    id: 715,
    author: 'Leah Tardivel',
    url: 'https://unsplash.com/photos/v8-AqxWvb6A',
  },
  {
    id: 717,
    author: 'David Marcu',
    url: 'https://unsplash.com/photos/oyrtK2hJqBY',
  },
  {
    id: 724,
    author: 'Nelly Volkovich',
    url: 'https://unsplash.com/photos/ZSMgNjYrHRM',
  },
  {
    id: 741,
    author: 'Garrett Carroll',
    url: 'https://unsplash.com/photos/5iPhUVPYWsw',
  },
  {
    id: 774,
    author: 'Alex Wigan',
    url: 'https://unsplash.com/photos/5qlegaTwZpM',
  },
  {
    id: 776,
    author: 'Autumn Mott',
    url: 'https://unsplash.com/photos/SPd9CSoWCkY',
  },
  {
    id: 777,
    author: 'Julia Caesar',
    url: 'https://unsplash.com/photos/DpoMKEARZe4',
  },
  {
    id: 780,
    author: 'Amy Zhang',
    url: 'https://unsplash.com/photos/CNzh2A9_jwE',
  },
  {
    id: 788,
    author: 'Michael Baird',
    url: 'https://unsplash.com/photos/6WLGMivmV00',
  },
  {
    id: 794,
    author: 'Lauren Coleman',
    url: 'https://unsplash.com/photos/shy0cEi7h1o',
  },
  {
    id: 797,
    author: 'Gabriel Santiago',
    url: 'https://unsplash.com/photos/1vYkQVDWXl0',
  },
  {
    id: 799,
    author: 'Yulia Vambold',
    url: 'https://unsplash.com/photos/s0ifr6qb6H0',
  },
  {
    id: 803,
    author: 'Saul Cuellar',
    url: 'https://unsplash.com/photos/Tr8GJW-vI3Y',
  },
  {
    id: 806,
    author: 'Giovanni Corte',
    url: 'https://unsplash.com/photos/n9SLYuyyZhQ',
  },
  {
    id: 815,
    author: 'Mayur Gala',
    url: 'https://unsplash.com/photos/2PODhmrvLik',
  },
  {
    id: 817,
    author: 'Alex wong',
    url: 'https://unsplash.com/photos/ssrbaKvxaos',
  },
  {
    id: 823,
    author: 'Benjamin Combs',
    url: 'https://unsplash.com/photos/hiAdjnXZxl8',
  },
  {
    id: 824,
    author: 'Pineapples',
    url: 'https://unsplash.com/photos/t-W4_309hi8',
  },
  {
    id: 829,
    author: 'Drew Hays',
    url: 'https://unsplash.com/photos/e6Fi_FBMfY0',
  },
  {
    id: 835,
    author: 'Olenka Kotyk',
    url: 'https://unsplash.com/photos/eqsEZNCm4-c',
  },
  {
    id: 845,
    author: 'Rafael Le\u00e3o',
    url: 'https://unsplash.com/photos/PW0-vZD0wis',
  },
  {
    id: 849,
    author: 'Rob Bye',
    url: 'https://unsplash.com/photos/OlZ1nWLEEgM',
  },
  {
    id: 851,
    author: 'Tiago Aguiar',
    url: 'https://unsplash.com/photos/uXzNVOZT5no',
  },
  {
    id: 855,
    author: 'Rodion Kutsaev',
    url: 'https://unsplash.com/photos/IJ25m7fXqtk',
  },
  {
    id: 857,
    author: 'Dmitry Sytnik',
    url: 'https://unsplash.com/photos/bW2vHKCxbx4',
  },
  {
    id: 859,
    author: 'Brennan Ehrhardt',
    url: 'https://unsplash.com/photos/HALe2SmkWAI',
  },
  {
    id: 867,
    author: 'Stefanus Martanto Setyo Husodo',
    url: 'https://unsplash.com/photos/GKR1tBkmW3M',
  },
  {
    id: 870,
    author: 'Joshua Hibbert',
    url: 'https://unsplash.com/photos/Pn6iimgM-wo',
  },
  {
    id: 871,
    author: 'Stefan Kunze',
    url: 'https://unsplash.com/photos/1-C334jLxG0',
  },
  {
    id: 881,
    author: '\u8d1d\u8389\u513f NG',
    url: 'https://unsplash.com/photos/bviex5lwf3s',
  },
  {
    id: 896,
    author: 'Jenna Beekhuis',
    url: 'https://unsplash.com/photos/Bm0Ja6LZWl4',
  },
  {
    id: 900,
    author: 'Todd DeSantis',
    url: 'https://unsplash.com/photos/W_9mOGUwR08',
  },
  {
    id: 901,
    author: 'Marcelo Quinan',
    url: 'https://unsplash.com/photos/R3pUGn5YiTg',
  },
  {
    id: 902,
    author: 'Nitish Meena',
    url: 'https://unsplash.com/photos/RbbdzZBKRDY',
  },
  {
    id: 903,
    author: 'Greg Rakozy',
    url: 'https://unsplash.com/photos/oMpAz-DN-9I',
  },
  {
    id: 907,
    author: 'Pierre Bouillot',
    url: 'https://unsplash.com/photos/FRYtAMzphLs',
  },
  {
    id: 908,
    author: 'Pedro Gandra',
    url: 'https://unsplash.com/photos/PKVcQXEcfLU',
  },
  {
    id: 937,
    author: 'Sergei Akulich',
    url: 'https://unsplash.com/photos/hJ2BFoo8DKg',
  },
  {
    id: 946,
    author: 'Padurariu Alexandru',
    url: 'https://unsplash.com/photos/2UE1givDiPM',
  },
  {
    id: 951,
    author: 'S\u00e9rgio Rola',
    url: 'https://unsplash.com/photos/4aQY2CrXsa8',
  },
  {
    id: 953,
    author: 'Alexandre Perotto',
    url: 'https://unsplash.com/photos/zCevd81eJDU',
  },
  { id: 967, author: 'NASA', url: 'https://unsplash.com/photos/NuE8Nu3otjo' },
  {
    id: 970,
    author: 'Darrell Cassell',
    url: 'https://unsplash.com/photos/hoCXpPUMCoE',
  },
  {
    id: 981,
    author: 'Anna Anikina',
    url: 'https://unsplash.com/photos/AtH9GMAkfPE',
  },
  {
    id: 987,
    author: 'Sebastien Gabriel',
    url: 'https://unsplash.com/photos/2W5LoumSdfw',
  },
  {
    id: 995,
    author: 'davide ragusa',
    url: 'https://unsplash.com/photos/4jcFu1byopQ',
  },
  {
    id: 997,
    author: "Mickey O'neil",
    url: 'https://unsplash.com/photos/GSzD6vGIWKM',
  },
  { id: 1002, author: 'NASA', url: 'https://unsplash.com/photos/6-jTZysYY_U' },
  {
    id: 1011,
    author: 'Roberto Nickson',
    url: 'https://unsplash.com/photos/7BjmDICVloE',
  },
  {
    id: 1015,
    author: 'Alexey Topolyanskiy',
    url: 'https://unsplash.com/photos/-oWyJoSqBRM',
  },
  {
    id: 1016,
    author: 'Philippe Wuyts',
    url: 'https://unsplash.com/photos/_h7aBovKia4',
  },
  { id: 1032, author: 'NASA', url: 'https://unsplash.com/photos/E7q00J_8N7A' },
  {
    id: 1069,
    author: 'Marat Gilyadzinov',
    url: 'https://unsplash.com/photos/wpTWYBll4_w',
  },
  {
    id: 1070,
    author: 'Sean Stratton',
    url: 'https://unsplash.com/photos/3I5j50pIXvU',
  },
  {
    id: 1080,
    author: 'veeterzy',
    url: 'https://unsplash.com/photos/OJJIaFZOeX4',
  },
];

/** A random photo, never the same one twice in a row */
export function pickRandomPhoto(currentId?: number): RandomPhoto {
  const choices = RANDOM_PHOTOS.filter((photo) => photo.id !== currentId);
  return choices[Math.floor(Math.random() * choices.length)];
}

export function randomPhotoSrc(
  photo: RandomPhoto,
  width: number,
  height: number,
) {
  return `https://picsum.photos/id/${photo.id}/${width}/${height}`;
}
