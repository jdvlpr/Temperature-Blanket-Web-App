import type { Brand } from '$lib/types/yarn-types';
import { yarn as megaBall } from './mega-ball/yarn';
// import rainbowCottonEightFour from './rainbow-cotton-8-4/yarn'; // removed because it has all the same names and colors

export const brand: Brand = {
  name: 'We Love Yarn',
  id: 'we_love_yarn',
  yarns: [megaBall],
};
