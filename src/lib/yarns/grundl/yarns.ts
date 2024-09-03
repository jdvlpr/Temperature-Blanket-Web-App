import type { Brand } from '$lib/types';
import { yarn as cottonFun } from './cotton-fun/yarn';

export const brand: Brand = {
  name: 'Gründl',
  id: 'gruendl',
  yarns: [cottonFun],
};
