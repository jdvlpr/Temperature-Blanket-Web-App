import type { Brand } from '$lib/types';
import { yarn as twotwozeroSolidsAndHeathers } from './220-solids-and-heathers/yarn';
import { yarn as twotwozeroSuperwash } from './220-superwash/yarn';
import { yarn as twotwozeroSuperwashMerino } from './220-superwash-merino/yarn';
import { yarn as aegeanTweed } from './aegean-tweed/yarn';
import { yarn as anchorBay } from './anchor-bay/yarn';
import { yarn as heritage } from './heritage/yarn';
import { yarn as ultraPima } from './ultra-pima/yarn';

export const brand: Brand = {
  name: 'Cascade',
  id: 'cascade',
  yarns: [
    twotwozeroSolidsAndHeathers,
    twotwozeroSuperwash,
    twotwozeroSuperwashMerino,
    aegeanTweed,
    anchorBay,
    heritage,
    ultraPima,
  ],
};
