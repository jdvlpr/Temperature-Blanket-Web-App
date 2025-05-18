import type { Brand } from '$lib/types';
import { yarn as acacia } from './acacia/yarn';
import { yarn as amigo } from './amigo/yarn';
import { yarn as amigoChunky } from './amigo-chunky/yarn';
import { yarn as amigoXl } from './amigo-xl/yarn';
import { yarn as dailyStitchAcrylicXl } from './daily-stitch-acrylic-xl/yarn';
import { yarn as embroideryYarn } from './embroidery-yarn/yarn';
import { yarn as friendsCottonEightFour } from './friends-cotton-8-4/yarn';
import { yarn as friendsCottonEightEight } from './friends-cotton-8-8/yarn';
import { yarn as friendsCottonSilk } from './friends-cotton-silk/yarn';
import { yarn as friendsWheel } from './friends-wheel/yarn';
import { yarn as friendsWool } from './friends-wool/yarn';
import { yarn as happyPlaceSolid } from './happy-place-solid/yarn';
import { yarn as highlandWool } from './highland-wool/yarn';
import { yarn as honeyBunny } from './honey-bunny/yarn';
import { yarn as kindFeather } from './kind-feather/yarn';
import { yarn as rainbowCottonEightFour } from './rainbow-cotton-8-4/yarn';
import { yarn as rainbowCottonEightEight } from './rainbow-cotton-8-8/yarn';
import { yarn as rainbowDeluxeEightFour } from './rainbow-deluxe-8-4/yarn';
import { yarn as tweedDreams } from './tweed-dreams/yarn';
import { yarn as twisterSolid } from './twister-solid/yarn';
import { yarn as udon } from './udon/yarn';
import { yarn as unicornSolid } from './unicorn-solid/yarn';
import { yarn as winterGlowSolid } from './winter-glow-solid/yarn';

export const brand: Brand = {
  name: 'Hobbii',
  id: 'hobbii',
  yarns: [
    acacia,
    amigoChunky,
    amigoXl,
    amigo,
    dailyStitchAcrylicXl,
    embroideryYarn,
    friendsCottonEightFour,
    friendsCottonEightEight,
    friendsCottonSilk,
    friendsWheel,
    friendsWool,
    happyPlaceSolid,
    highlandWool,
    honeyBunny,
    kindFeather,
    rainbowCottonEightFour,
    rainbowCottonEightEight,
    rainbowDeluxeEightFour,
    tweedDreams,
    twisterSolid,
    udon,
    unicornSolid,
    winterGlowSolid,
  ],
};
