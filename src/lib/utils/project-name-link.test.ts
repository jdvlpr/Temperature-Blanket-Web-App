import { describe, expect, it } from 'vitest';
import {
  MAX_LINK_NAME_LENGTH,
  projectNameFromHash,
  withProjectName,
} from './project-name-link';

// The split that getProjectParametersFromURLHash (project-utils) and the other
// hash readers use, which can't be imported here without the planner's state
const splitHash = (hash: string) =>
  hash
    .split('&')
    .reduce((res: Record<string, { key: string; value: string }>, item) => {
      const parts = item.split('=');
      res[parts[0]] = { key: parts[0], value: decodeURIComponent(parts[1]) };
      return res;
    }, {});

const HREF = 'https://example.com/?project=1&v=7.0.0#l=1,20250101,!&u=m';
const hashOf = (href: string) => new URL(href).hash;

describe('withProjectName', () => {
  it('leaves the link alone without a name, or with the title as the name', () => {
    expect(withProjectName(HREF, '')).toBe(HREF);
    expect(withProjectName(HREF, '   ')).toBe(HREF);
    expect(withProjectName(HREF, undefined)).toBe(HREF);
    expect(withProjectName(HREF, 'Chicago', 'Chicago')).toBe(HREF);
  });

  it('leaves a link without settings alone', () => {
    expect(withProjectName('https://example.com/', 'Name')).toBe(
      'https://example.com/',
    );
  });

  it('writes spaces as + and keeps the rest of the hash', () => {
    const link = withProjectName(HREF, 'My Blanket');
    expect(link).toBe(`${HREF}&m=My+Blanket`);
  });

  it('round-trips awkward names', () => {
    for (const name of [
      'Grandma’s 2025 Blanket',
      'A + B',
      'Rock & Roll',
      'x=y',
      '100% wool #1',
      'Snow ❄️ day 🧶',
      'Ünïcödé',
    ]) {
      const link = withProjectName(HREF, name);
      expect(projectNameFromHash(hashOf(link))).toBe(name);
    }
  });

  it('carries at most 60 characters, without splitting an emoji', () => {
    const long = '🧶'.repeat(70);
    const read = projectNameFromHash(hashOf(withProjectName(HREF, long)));
    expect(Array.from(read)).toHaveLength(MAX_LINK_NAME_LENGTH);
    expect(read).toBe('🧶'.repeat(MAX_LINK_NAME_LENGTH));
  });

  it('stays readable by the hash readers that split on & and =', () => {
    const link = withProjectName(HREF, 'Rock & Roll = fun');
    const params = splitHash(hashOf(link));
    expect(params.u.value).toBe('m');
    expect(Object.keys(params)).toContain('m');
  });
});

describe('projectNameFromHash', () => {
  it('is empty without a name or with a broken one', () => {
    expect(projectNameFromHash('#l=1,20250101,!&u=m')).toBe('');
    expect(projectNameFromHash('#l=1&m=%E0%A4%A')).toBe('');
    expect(projectNameFromHash('')).toBe('');
  });

  it('cleans what it reads', () => {
    expect(projectNameFromHash('#l=1&m=%20%20Two++spaces%0A')).toBe(
      'Two spaces',
    );
  });
});
