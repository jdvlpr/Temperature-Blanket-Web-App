import { PUBLIC_SUPPORTERS } from '$env/static/public';
import type { Supporters } from '$lib/types';

export const SUPPORTERS: Supporters | null = PUBLIC_SUPPORTERS
  ? JSON.parse(PUBLIC_SUPPORTERS)
  : null;
