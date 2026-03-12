import type { Brand } from '$lib/types/yarn-types';
import { yarn as amigurumi } from './amigurumi/yarn';
import { yarn as amigurumiSoft } from './amigurumi-soft/yarn';
import { yarn as mollet } from './mollet/yarn';

export const brand: Brand = {
  name: 'Círculo',
  id: 'circulo',
  yarns: [amigurumi, amigurumiSoft, mollet],
};
