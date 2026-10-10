import { PUBLIC_SUPPORTERS } from '$app/env/public';
import type { Supporters } from '#lib/types/supporter-types.js';

export const SUPPORTERS: Supporters | null = PUBLIC_SUPPORTERS
  ? JSON.parse(PUBLIC_SUPPORTERS)
  : null;
