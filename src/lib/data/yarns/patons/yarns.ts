import type { Brand } from '$lib/types';
import { yarn as astra } from './astra/yarn';
import { yarn as canadiana } from './canadiana/yarn';
import { yarn as classicWoolWorsted } from './classic-wool-worsted/yarn';

export const brand: Brand = {
  name: 'Patons',
  id: 'patons',
  yarns: [astra, canadiana, classicWoolWorsted],
};
