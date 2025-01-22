import type { Color } from '$lib/types';

class YarnState {
  colors: Color[] = $state([
    {
      hex: '#f43f5e',
    },
    {
      hex: '#d946ef',
    },
    {
      hex: '#8b5cf6',
    },
    {
      hex: '#3b82f6',
    },
    {
      hex: '#06b6d4',
    },
    {
      hex: '#10b981',
    },
    {
      hex: '#eab308',
    },
    {
      hex: '#f97316',
    },
  ]);
}

export const yarnPageState = new YarnState();
