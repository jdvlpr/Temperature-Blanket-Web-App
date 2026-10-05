import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as stringUtils from './string-utils';

// Flexible mock for browser environment
let isBrowser = true;
vi.mock('$app/environment', () => ({
  get browser() {
    return isBrowser;
  },
}));

describe('string-utils', () => {
  beforeEach(() => {
    isBrowser = true;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('pluralize', () => {
    it('should pluralize a simple string', () => {
      expect(stringUtils.pluralize('apple', 2)).toBe('apples');
      expect(stringUtils.pluralize('apple', 1)).toBe('apple');
    });

    it('should pluralize with custom suffix', () => {
      expect(stringUtils.pluralize('bus', 2, 'es')).toBe('buses');
    });

    it('should pluralize using object notation', () => {
      expect(
        stringUtils.pluralize({ singular: 'person', plural: 'people' }, 2),
      ).toBe('people');
      expect(
        stringUtils.pluralize({ singular: 'person', plural: 'people' }, 1),
      ).toBe('person');
    });
  });

  describe('decodeEntity', () => {
    it('should decode HTML entities via DOM when in browser', () => {
      isBrowser = true;
      // Manual stub since jsdom is not installed
      vi.stubGlobal('document', {
        createElement: (tag: string) => {
          if (tag === 'textarea') {
            let content = '';
            return {
              set innerHTML(val: string) {
                // Minimal decoding simulation
                content = val
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&#39;/g, "'");
              },
              get value() {
                return content;
              },
            };
          }
          return {};
        },
      });

      expect(stringUtils.decodeEntity('&amp;')).toBe('&');
      expect(stringUtils.decodeEntity('&lt;')).toBe('<');
      expect(stringUtils.decodeEntity('&#39;')).toBe("'");
    });

    it('should return input string if not in browser', () => {
      isBrowser = false;
      expect(stringUtils.decodeEntity('&amp;')).toBe('&amp;');
    });
  });

  describe('stripHTMLTags', () => {
    it('should remove HTML tags from string', () => {
      expect(stringUtils.stripHTMLTags('<p>Hello</p>')).toBe('Hello');
      expect(stringUtils.stripHTMLTags('<div><span>Text</span></div>')).toBe(
        'Text',
      );
    });

    it('should return original string if no tags', () => {
      expect(stringUtils.stripHTMLTags('Hello World')).toBe('Hello World');
    });
  });

  describe('escapeHtml', () => {
    it('escapes characters that could become markup', () => {
      expect(stringUtils.escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
        '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;',
      );
    });

    it('leaves plain text alone', () => {
      expect(stringUtils.escapeHtml('Sunset Stripes 2026')).toBe(
        'Sunset Stripes 2026',
      );
    });
  });
});

describe('cleanName', () => {
  const { cleanName } = stringUtils;

  it('trims and collapses whitespace, including line breaks and tabs', () => {
    expect(cleanName('  Gift \n\t for   Ana  ', 100)).toBe('Gift for Ana');
  });

  it('removes control and invisible formatting characters', () => {
    expect(cleanName('Evil\u202Egnp.exe', 100)).toBe('Evilgnp.exe');
    expect(cleanName('a\u0000b\u0007c', 100)).toBe('a b c');
    expect(cleanName('\u200B\uFEFFHidden\u2066', 100)).toBe('Hidden');
  });

  it('keeps markup as text (escaping happens where it is shown)', () => {
    expect(cleanName('<img src=x onerror=alert(1)>', 100)).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });

  it('keeps accents and emoji, and never splits one at the limit', () => {
    expect(cleanName('Montr\u00E9al \u{1F9F6}', 100)).toBe(
      'Montr\u00E9al \u{1F9F6}',
    );
    const family = '\u{1F469}\u200D\u{1F467}';
    expect(cleanName(family, 100)).toBe(family);
    expect(cleanName('ab\u{1F9F6}', 3)).toBe('ab\u{1F9F6}');
    expect(cleanName('abc\u{1F9F6}', 3)).toBe('abc');
  });

  it('gives an empty string for anything but a string', () => {
    expect(cleanName(undefined, 100)).toBe('');
    expect(cleanName(42, 100)).toBe('');
    expect(cleanName('   ', 100)).toBe('');
  });
});

describe('decodeHtmlEntities', () => {
  it('turns WordPress’s rendered titles back into text', () => {
    expect(
      stringUtils.decodeHtmlEntities(
        'Mum&#8217;s &amp; Dad&#039;s &quot;blanket&quot; &#x2014; &lt;b&gt;',
      ),
    ).toBe('Mum’s & Dad\'s "blanket" — <b>');
  });

  it('leaves unknown or invalid entities alone', () => {
    expect(
      stringUtils.decodeHtmlEntities('&bogus; &#0; &#x110000; a & b'),
    ).toBe('&bogus; &#0; &#x110000; a & b');
  });
});
