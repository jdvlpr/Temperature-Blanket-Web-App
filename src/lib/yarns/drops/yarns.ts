import type { Brand } from '$lib/types';
import { yarn as alpaca } from './alpaca/yarn';
import { yarn as babyMerino } from './baby-merino/yarn';
import { yarn as cottonLight } from './cotton-light/yarn';
import { yarn as cottonMerino } from './cotton-merino/yarn';
import { yarn as karisma } from './karisma/yarn';
import { yarn as lovesYou7 } from './loves-you-7/yarn';
import { yarn as lovesYou9 } from './loves-you-9/yarn';
import { yarn as merinoExtraFine } from './merino-extra-fine/yarn';
import { yarn as muskat } from './muskat/yarn';
import { yarn as nepal } from './nepal/yarn';

export const brand: Brand = {
  name: 'DROPS',
  id: 'drops',
  yarns: [
    alpaca,
    babyMerino,
    cottonLight,
    cottonMerino,
    karisma,
    lovesYou7,
    lovesYou9,
    merinoExtraFine,
    muskat,
    nepal,
  ],
};
