import type { Brand } from '$lib/types';
import { yarn as blanket } from './blanket/yarn';
import { yarn as blanketMistical } from './blanket-mist-ical/yarn';
import { yarn as softeeBaby } from './softee-baby/yarn';
import { yarn as softeeCotton } from './softee-cotton/yarn';
import { yarn as superValue } from './super-value/yarn';

export const brand: Brand = {
  name: 'Bernat',
  id: 'bernat',
  yarns: [blanket, blanketMistical, softeeBaby, softeeCotton, superValue],
};
