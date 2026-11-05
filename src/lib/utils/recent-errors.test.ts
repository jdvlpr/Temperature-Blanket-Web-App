import { describe, expect, it } from 'vitest';
import { ERRORS_MAX } from './beta-feedback';
import { describeError, noteError, recentErrors } from './recent-errors';

describe('recent errors', () => {
  it('describes an error by its name, message and where it was thrown', () => {
    const error = new TypeError('x is undefined');
    expect(describeError(error)).toMatch(/^TypeError: x is undefined/);
    expect(describeError('plain text')).toBe('plain text');
    expect(describeError({ not: 'an error' })).toBeNull();
  });

  it('ignores other origins’ “Script error.”', () => {
    expect(describeError('Script error.')).toBeNull();
    expect(describeError(new Error('Script error.'))).toBeNull();
  });

  it('keeps the last few, without repeats in a row', () => {
    noteError('same');
    noteError('same');
    expect(recentErrors().filter((e) => e === 'same')).toHaveLength(1);
    for (let i = 0; i < ERRORS_MAX + 3; i++) noteError(`error ${i}`);
    const errors = recentErrors();
    expect(errors).toHaveLength(ERRORS_MAX);
    expect(errors.at(-1)).toBe(`error ${ERRORS_MAX + 2}`);
  });
});
