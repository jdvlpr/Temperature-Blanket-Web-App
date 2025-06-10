import type { Brand } from '$lib/types';
import { yarn as cottonMerino } from './cotton-merino/yarn';
import { yarn as merino } from './merino/yarn';

export const brand: Brand = {
  name: 'Knitting for Olive',
  id: 'knitting_for_olive',
  yarns: [cottonMerino, merino],
};
