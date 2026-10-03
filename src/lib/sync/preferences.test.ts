import { describe, expect, it } from 'vitest';
import { mergePreferences, parsePreferencesUpload } from './preferences';

describe('parsePreferencesUpload', () => {
  it('keeps only known preferences with allowed values and times', () => {
    expect(
      parsePreferencesUpload(
        {
          'theme.id': { value: 'rocket', updatedAt: 5 },
          'theme.mode': { value: 'neon', updatedAt: 5 },
          'theme.textScale': { value: 'large', updatedAt: 5 },
          defaultYarn: { value: 'brand-yarn', updatedAt: 0 },
          'theme.roundness': { value: 'sharp' },
        },
        100,
      ),
    ).toEqual({ 'theme.id': { value: 'rocket', updatedAt: 5 } });
  });

  it('brings a time from the future back to now', () => {
    expect(
      parsePreferencesUpload(
        { defaultYarn: { value: 'a-b', updatedAt: 500 } },
        100,
      ),
    ).toEqual({ defaultYarn: { value: 'a-b', updatedAt: 100 } });
  });

  it('is null when nothing is valid', () => {
    expect(parsePreferencesUpload({ units: 'metric' }, 100)).toBeNull();
    expect(parsePreferencesUpload(null, 100)).toBeNull();
  });
});

describe('mergePreferences', () => {
  it('takes the newer change to each preference', () => {
    const { values, changed } = mergePreferences(
      {
        'theme.id': { value: 'rocket', updatedAt: 10 },
        'theme.mode': { value: 'dark', updatedAt: 10 },
      },
      {
        'theme.id': { value: 'modern', updatedAt: 5 },
        'theme.mode': { value: 'light', updatedAt: 20 },
        defaultYarn: { value: 'a-b', updatedAt: 1 },
      },
    );
    expect(changed).toBe(true);
    expect(values).toEqual({
      'theme.id': { value: 'rocket', updatedAt: 10 },
      'theme.mode': { value: 'light', updatedAt: 20 },
      defaultYarn: { value: 'a-b', updatedAt: 1 },
    });
  });

  it('changes nothing for older or equal changes', () => {
    const current = { 'theme.id': { value: 'rocket', updatedAt: 10 } };
    expect(
      mergePreferences(current, {
        'theme.id': { value: 'modern', updatedAt: 10 },
      }).changed,
    ).toBe(false);
  });
});
