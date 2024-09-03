import type { Brand } from '$lib/types';
import { yarn as cahlista } from './cahlista/yarn';
import { yarn as catona } from './catona/yarn';
import { yarn as chunkyMonkey } from './chunky-monkey/yarn';
import { yarn as colourCrafter } from './colour-crafter/yarn';
import { yarn as scrumptious } from './scrumptious/yarn';
import { yarn as softfun } from './softfun/yarn';
import { yarn as stoneWashed } from './stone-washed/yarn';

export const brand: Brand = {
  name: 'Scheepjes',
  id: 'scheepjes',
  yarns: [
    cahlista,
    catona,
    chunkyMonkey,
    colourCrafter,
    scrumptious,
    softfun,
    stoneWashed,
  ],
};
