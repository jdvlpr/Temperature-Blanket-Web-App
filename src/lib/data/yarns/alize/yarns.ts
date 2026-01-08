import type { Brand } from '$lib/types';
import { yarn as cottonGold } from './cotton-gold/yarn';
import { yarn as superlandaMidi } from './superlana-midi/yarn';

export const brand: Brand = {
  name: 'Alize',
  id: 'alize',
  yarns: [cottonGold, superlandaMidi],
};
