import type { Brand } from '$lib/types';
import { yarn as flindersCotton8Ply } from './flinders-cotton-8-ply/yarn';
import { yarn as marvel8Ply } from './marvel-8-ply/yarn';
import { yarn as marvel12PlyBulky } from './marvel-12-ply-bulky/yarn';

export const brand: Brand = {
  name: '4 Seasons',
  id: '4_seasons',
  yarns: [flindersCotton8Ply, marvel8Ply, marvel12PlyBulky],
};
