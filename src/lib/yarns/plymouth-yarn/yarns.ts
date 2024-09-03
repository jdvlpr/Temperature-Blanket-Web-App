import type { Brand } from '$lib/types';
import { yarn as dkMerinoSuperwash } from './dk-merino-superwash/yarn';
import { yarn as encoreWorsted } from './encore-worsted/yarn';
import { yarn as worstedMerinoSuperwash } from './worsted-merino-superwash/yarn';

export const brand: Brand = {
  name: 'Plymouth Yarn',
  id: 'plymouth_yarn',
  yarns: [dkMerinoSuperwash, encoreWorsted, worstedMerinoSuperwash],
};
