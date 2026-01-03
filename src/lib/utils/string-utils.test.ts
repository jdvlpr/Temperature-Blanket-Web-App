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
});
