import { describe, expect, it, vi } from 'vitest';
import { delay, hasParentWithClass } from './function-utils.svelte';

// Mock svelte components/state modules
vi.mock('$lib/components/WeatherTableWrapper.svelte', () => ({
  weatherDataUpdatedKey: { value: 0 },
}));
vi.mock('$lib/state', () => ({
  gauges: { allCreated: [] },
  project: { url: { href: '' } },
  weather: { data: [] },
}));

// Helper to create mock elements
function createMockElement(className?: string, parent?: any) {
  const el = {
    classList: {
      contains: (c: string) => el.classList._classes.includes(c),
      add: (c: string) => el.classList._classes.push(c),
      _classes: className ? [className] : ([] as string[]),
    },
    parentElement: parent || null,
    target: null as any,
  };
  return el;
}

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

  describe('hasParentWithClass', () => {
    it('should return true if parent has class', () => {
      const parent = createMockElement('target-class');
      const child = createMockElement(undefined, parent);

      const event = { target: child };
      expect(hasParentWithClass(event, 'target-class')).toBe(true);
    });

    it('should return false if no parent has class', () => {
      const parent = createMockElement('other-class');
      const child = createMockElement(undefined, parent);

      const event = { target: child };
      expect(hasParentWithClass(event, 'target-class')).toBe(false);
    });

    it('should return false if element itself has class but parents do not', () => {
      // Validation of existing logic: the function only checks parents.
      const element = createMockElement('target-class'); // No parent
      const event = { target: element };
      expect(hasParentWithClass(event, 'target-class')).toBe(false);
    });
  });
});
