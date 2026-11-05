import { describe, expect, it } from 'vitest';
import {
  CONTEXT_MAX,
  ERRORS_MAX,
  FEEDBACK_ASK_AFTER_MS,
  issueUrl,
  MESSAGE_MAX,
  parseFeedback,
  pathOnly,
  readinessCounts,
  shouldAskForFeedback,
  cleanContext,
} from './beta-feedback';

const body = (overrides: Record<string, unknown> = {}) => ({
  kind: 'broken',
  ready: null,
  message: '  The chart is blank  ',
  email: null,
  page: '/weather',
  context: { version: '7.0.0', errors: [] },
  ...overrides,
});

describe('parseFeedback', () => {
  it('takes a message, trimmed', () => {
    const parsed = parseFeedback(body());
    expect(parsed).toMatchObject({
      ok: true,
      feedback: { kind: 'broken', message: 'The chart is blank', ready: null },
    });
  });

  it('takes "how it’s going" with just an answer, nothing else empty', () => {
    expect(
      parseFeedback(body({ kind: 'overall', ready: 'yes', message: '' })).ok,
    ).toBe(true);
    expect(parseFeedback(body({ kind: 'overall', message: ' ' })).ok).toBe(
      false,
    );
    expect(
      parseFeedback(body({ kind: 'idea', ready: 'yes', message: '' })).ok,
    ).toBe(false);
  });

  it('refuses what isn’t feedback', () => {
    expect(parseFeedback(null).ok).toBe(false);
    expect(parseFeedback(body({ kind: 'spam' })).ok).toBe(false);
    expect(parseFeedback(body({ message: 42 })).ok).toBe(false);
    expect(
      parseFeedback(body({ message: 'x'.repeat(MESSAGE_MAX + 1) })).ok,
    ).toBe(false);
    expect(parseFeedback(body({ email: 'not an email' })).ok).toBe(false);
  });

  it('drops an unknown answer and keeps a good email', () => {
    const parsed = parseFeedback(
      body({ ready: 'maybe', email: ' ada@example.test ' }),
    );
    expect(parsed).toMatchObject({
      ok: true,
      feedback: { ready: null, email: 'ada@example.test' },
    });
  });

  it('never keeps the page’s query, which holds a project', () => {
    const parsed = parseFeedback(
      body({ page: '/?project=abc&location=Paris#top' }),
    );
    expect(parsed.ok && parsed.feedback.page).toBe('/');
    expect(pathOnly('https://evil.test/x')).toBe('/');
    expect(pathOnly(undefined)).toBe('/');
  });
});

describe('cleanContext', () => {
  it('keeps only what’s expected, trimmed', () => {
    const context = cleanContext({
      version: '7.0.0',
      userAgent: 'u'.repeat(1000),
      hadQuery: 'yes',
      extra: 'dropped',
      errors: ['a', 2, ...Array.from({ length: 10 }, (_, i) => `e${i}`)],
    });
    expect(context).not.toHaveProperty('extra');
    expect(context.userAgent).toHaveLength(400);
    expect(context.hadQuery).toBe(false);
    expect(context.errors).toHaveLength(ERRORS_MAX);
    expect(context.errors.at(-1)).toBe('e9');
    expect(JSON.stringify(context).length).toBeLessThanOrEqual(CONTEXT_MAX);
  });

  it('copes with nothing', () => {
    expect(cleanContext(undefined)).toMatchObject({ version: '', errors: [] });
  });
});

describe('readinessCounts', () => {
  it('counts answers, since a time', () => {
    const items = [
      { createdAt: 1, ready: 'yes' as const },
      { createdAt: 5, ready: 'mostly' as const },
      { createdAt: 6, ready: null },
      { createdAt: 7, ready: 'not-yet' as const },
    ];
    expect(readinessCounts(items)).toEqual({
      yes: 1,
      mostly: 1,
      'not-yet': 1,
      total: 3,
    });
    expect(readinessCounts(items, 5).total).toBe(2);
  });
});

describe('issueUrl', () => {
  it('fills in an issue without who sent it', () => {
    const url = new URL(
      issueUrl({
        kind: 'confusing',
        ready: 'not-yet',
        message: 'Where is Save?\nI looked everywhere',
        page: '/',
        context: cleanContext({
          version: '7.0.0',
          userAgent: 'Safari',
          errors: ['TypeError: boom'],
        }),
      }),
    );
    expect(url.origin + url.pathname).toBe(
      'https://github.com/jdvlpr/Temperature-Blanket-Web-App/issues/new',
    );
    expect(url.searchParams.get('title')).toBe('Beta feedback: Where is Save?');
    expect(url.searchParams.get('labels')).toBe('needs-triage');
    const text = url.searchParams.get('body')!;
    expect(text).toContain('Something’s confusing');
    expect(text).toContain('Not yet');
    expect(text).toContain('> I looked everywhere');
    expect(text).toContain('TypeError: boom');
    expect(text).not.toContain('@');
  });
});

describe('shouldAskForFeedback', () => {
  it('asks once, after a few minutes, when nothing else is showing', () => {
    const ready = {
      timeInView: FEEDBACK_ASK_AFTER_MS,
      asked: false,
      busy: false,
    };
    expect(shouldAskForFeedback(ready)).toBe(true);
    expect(shouldAskForFeedback({ ...ready, timeInView: 1000 })).toBe(false);
    expect(shouldAskForFeedback({ ...ready, asked: true })).toBe(false);
    expect(shouldAskForFeedback({ ...ready, busy: true })).toBe(false);
  });
});
