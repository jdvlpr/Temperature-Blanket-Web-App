import type { Brand } from '$lib/types';
import { yarn as aranAcryCot } from './aran-acrycot/yarn';
import { yarn as aranAntiPill } from './aran-anti-pill/yarn';

export const brand: Brand = {
  name: 'Hobby Store',
  id: 'hobby_store',
  yarns: [aranAcryCot, aranAntiPill],
};
