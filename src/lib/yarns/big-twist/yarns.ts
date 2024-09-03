import type { Brand } from '$lib/types';
import { yarn as bigTwistSoft } from './big-twist-soft/yarn';
import { yarn as heather } from './heather/yarn';
import { yarn as shine } from './shine/yarn';
import { yarn as value } from './value/yarn';

export const brand: Brand = {
  name: 'Big Twist',
  id: 'big_twist',
  yarns: [bigTwistSoft, heather, value, shine],
};
