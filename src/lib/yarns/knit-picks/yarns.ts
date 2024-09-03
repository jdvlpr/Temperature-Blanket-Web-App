import type { Brand } from '$lib/types';
import { yarn as bravaTweed } from './brava-tweed/yarn';
import { yarn as bravaWorsted } from './brava-worsted/yarn';
import { yarn as mightyStitch } from './mighty-stitch/yarn';
import { yarn as palette } from './palette/yarn';
import { yarn as shineSport } from './shine-sport/yarn';
import { yarn as stroll } from './stroll/yarn';
import { yarn as swishBulky } from './swish-bulky/yarn';
import { yarn as swishDK } from './swish-dk/yarn';
import { yarn as swishWorsted } from './swish-worsted/yarn';
import { yarn as woolOfTheAndesWorsted } from './wool-of-the-andes-worsted/yarn';

export const brand: Brand = {
  name: 'Knit Picks',
  id: 'knit_picks',
  yarns: [
    bravaTweed,
    bravaWorsted,
    mightyStitch,
    palette,
    shineSport,
    stroll,
    swishBulky,
    swishDK,
    swishWorsted,
    woolOfTheAndesWorsted,
  ],
};
