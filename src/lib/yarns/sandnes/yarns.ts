import type { Brand } from '$lib/types';
import { yarn as petiteknitDoubleSunday } from './petiteknit-double-sunday/yarn';
import { yarn as sunday } from './sunday/yarn';

export const brand: Brand = {
  name: 'Sandnes',
  id: 'sandnes',
  yarns: [petiteknitDoubleSunday, sunday],
};
