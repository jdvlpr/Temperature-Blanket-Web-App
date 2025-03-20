import type { Brand } from '$lib/types';
import { yarn as linenQuill } from './linen-quill/yarn';

export const brand: Brand = {
  name: 'Purl Soho',
  id: 'purl_soho',
  yarns: [linenQuill],
};
