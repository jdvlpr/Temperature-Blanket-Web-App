import { describe, expect, it, vi } from 'vitest';
import { delay } from './function-utils.svelte';

// Mock svelte components/state modules
vi.mock('$lib/components/WeatherTableWrapper.svelte', () => ({
  weatherDataUpdatedKey: { value: 0 },
}));
vi.mock('$lib/state/gauges-state.svelte', () => ({
  gauges: { allCreated: [] },
}));
vi.mock('$lib/state/project-state.svelte', () => ({
  project: { url: { href: '' } },
}));
vi.mock('$lib/state/weather-state.svelte', () => ({
  weather: { data: [] },
}));

describe('function-utils', () => {
  describe('delay', () => {
    it('should resolve after a specified time', async () => {
      vi.useFakeTimers();
      const promise = delay(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
      vi.useRealTimers();
    });
  });
});
