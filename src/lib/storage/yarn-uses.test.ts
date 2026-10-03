import { describe, expect, it } from 'vitest';
import {
  suggestsDefault,
  yarnKey,
  type YarnUsesState,
} from './yarn-uses.svelte';

const used = (count: number, declined: string[] = []): YarnUsesState => ({
  counts: { 'lion-basic': count },
  declined,
});

describe('suggestsDefault', () => {
  it('waits until a yarn has been saved twice', () => {
    expect(suggestsDefault(used(1), 'lion-basic', '')).toBe(false);
    expect(suggestsDefault(used(2), 'lion-basic', '')).toBe(true);
  });

  it("doesn't suggest the yarn that's already the default", () => {
    expect(suggestsDefault(used(5), 'lion-basic', 'lion-basic')).toBe(false);
  });

  it('suggests replacing a different default', () => {
    expect(suggestsDefault(used(5), 'lion-basic', 'caron-simply')).toBe(true);
  });

  it('never suggests a yarn again after Not Now', () => {
    expect(suggestsDefault(used(9, ['lion-basic']), 'lion-basic', '')).toBe(
      false,
    );
  });

  it('needs a yarn', () => {
    expect(suggestsDefault(used(5), '', '')).toBe(false);
  });
});

describe('yarnKey', () => {
  it('needs both a brand and a yarn', () => {
    expect(yarnKey('lion', 'basic')).toBe('lion-basic');
    expect(yarnKey('lion', undefined)).toBe('');
  });
});
