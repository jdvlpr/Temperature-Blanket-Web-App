import type { Brand } from '$lib/types';
import { yarn as amigo } from './amigo/yarn';
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
import { yarn as tweedDreams } from './tweed-dreams/yarn';
import { yarn as twisterSolid } from './twister-solid/yarn';
import { yarn as udon } from './udon/yarn';
import { yarn as unicornSolid } from './unicorn-solid/yarn';
import { yarn as winterGlowSolid } from './winter-glow-solid/yarn';

export const brand: Brand = {
  name: 'Hobbii',
  id: 'hobbii',
  yarns: [
    amigo,
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
    tweedDreams,
    twisterSolid,
    udon,
    unicornSolid,
    winterGlowSolid,
  ],
};
