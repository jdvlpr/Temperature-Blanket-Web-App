import { describe, expect, it, vi } from 'vitest';
import * as projectUtils from './project-utils.svelte';

// Mock dependencies
vi.mock('#lib/state/weather-state.svelte.js', () => ({
  weather: {
    data: [],
    grouping: 'month',
    rawData: [],
    missingDaysCount: () => 0,
    getWeatherSourceDetails: () => [],
  },
}));

vi.mock('#lib/state/location-state.svelte.js', () => ({
  locations: {
    projectTitle: 'Test Project',
    projectFilename: 'test-project',
    all: [],
  },
}));

vi.mock('#lib/state/gauges-state.svelte.js', () => ({
  gauges: { allCreated: [] },
  allGaugesAttributes: [],
  getWPGauge: vi.fn(() => ({})),
}));

vi.mock('#lib/state/preview-state.svelte.js', () => ({
  previews: { active: { wpTagId: 123 } },
}));

vi.mock('#lib/state/project-state.svelte.js', () => ({
  project: {
    url: { href: 'http://localhost' },
    gallery: { href: '', title: '' },
  },
}));

vi.mock('#lib/state/page-state.svelte.js', () => ({
  dialog: { trigger: vi.fn() },
  toast: { elements: [] },
}));

// Mock preferences
vi.mock('#lib/storage/preferences.svelte.js', () => ({
  preferences: {
    value: { units: 'imperial' },
  },
}));

// Mock utils that are used in project-utils
vi.mock('#lib/utils/color-utils.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    colorsToCode: vi.fn(() => 'code'),
    colorsToYarnDetails: vi.fn(() => 'details'),
  };
});

vi.mock('#lib/utils/unit-utils.svelte.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, convertTime: vi.fn((val) => val) };
});

vi.mock('#lib/utils/date-utils.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual, dateToISO8601String: vi.fn((date) => '2024-01-01') };
});

vi.mock('#lib/utils/weather-utils.svelte.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getWeatherSourceDetails: vi.fn(() => []),
    missingDaysCount: vi.fn(() => 0),
  };
});

vi.mock('#lib/utils/gallery-upload-utils.js', () => ({
  buildGalleryRequestBody: vi.fn(async () => '{}'),
}));

describe('project-utils', () => {
  describe('sendToProjectGallery', () => {
    const answer = (response: unknown, status = 200) =>
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: status < 300,
          status,
          json: async () => response,
        })),
      );
    vi.stubGlobal('window', {
      location: { origin: 'https://app.test' },
      dispatchEvent: vi.fn(),
    });

    it('gives the new page, as text', async () => {
      answer({
        code: 200,
        link: 'https://example.test/gallery/1',
        title: 'Ottawa &amp; Paris',
      });
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'sent',
        link: 'https://example.test/gallery/1',
        updated: false,
      });
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('/api/account/gallery?showOwner=false');
      expect(init?.method).toBe('POST');
    });

    it('updates the page in place with postId', async () => {
      answer({ code: 200, id: 8, link: 'https://example.test/project/8/x/' });
      expect(
        await projectUtils.sendToProjectGallery('img', { postId: 8 }),
      ).toEqual({ status: 'sent', link: '/gallery/8', updated: true });
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('/api/account/gallery/8');
      expect(init?.method).toBe('PUT');
    });

    it('never falls back to an anonymous submission', async () => {
      answer({ code: 'GALLERY_PAUSED' }, 503);
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'paused',
      });
      answer({ code: 'UNAUTHORIZED' }, 401);
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'signed-out',
      });
      answer({ code: 'UPDATE_UNSUPPORTED' }, 501);
      expect(
        await projectUtils.sendToProjectGallery('img', { postId: 2 }),
      ).toEqual({ status: 'unsupported' });
      expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).not.toContain(
        '/api/project',
      );
    });

    it('gives the page it duplicates', async () => {
      answer({
        code: 409,
        message: 'Duplicate',
        data: JSON.stringify({
          permalink: 'https://example.test/gallery/2',
          title: '<b>Ottawa</b> &amp; Paris',
        }),
      });
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'duplicate',
        link: 'https://example.test/gallery/2',
        title: '<b>Ottawa</b> & Paris',
      });
    });

    it("passes WordPress's message along as text", async () => {
      answer({ code: 500, message: 'Image upload error' });
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'error',
        message: 'Image upload error',
      });
    });

    it('says when it is too large', async () => {
      const { buildGalleryRequestBody } =
        await import('#lib/utils/gallery-upload-utils.js');
      vi.mocked(buildGalleryRequestBody).mockResolvedValueOnce(null);
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'too-large',
      });
    });
  });

  describe('getProjectParametersFromURLHash', () => {
    it('should parse hash string into object', () => {
      const hash = 'param1=value1&param2=value2';
      const result = projectUtils.getProjectParametersFromURLHash(hash);
      expect(result).toEqual({
        param1: { key: 'param1', value: 'value1' },
        param2: { key: 'param2', value: 'value2' },
      });
    });

    it('should decode URI components', () => {
      const hash = 'param1=Hello%20World';
      const result = projectUtils.getProjectParametersFromURLHash(hash);
      expect(result.param1.value).toBe('Hello World');
    });
  });

  describe('getTitleFromLocationsMeta', () => {
    it('should return empty string if locations is null', () => {
      expect(projectUtils.getTitleFromLocationsMeta(null)).toBe('');
    });

    it('should format location title correctly', () => {
      const locations = JSON.stringify([
        {
          label: 'City, Country',
          from: '2024-01-01',
          to: '2024-12-31',
          latlong: '0,0',
        },
      ]);
      const result = projectUtils.getTitleFromLocationsMeta(locations);

      // Note: The function uses toLocaleDateString with UTC.
      // 2024-01-01 is parsed as UTC.
      // Expected output format depends on the locale running the test (default Node locale usually en-US)
      // "1/1/2024" or "2024-01-01".
      // Let's check for containment to be safe/resilient to locale.
      expect(result).toContain('City, Country');
      expect(result).toContain('from');
      expect(result).toContain('to');
    });

    it('should handle missing city name replacement', () => {
      const locations = JSON.stringify([
        {
          label: 'Region, , Country',
          from: '2024-01-01',
          to: '2024-12-31',
          latlong: '0,0',
        },
      ]);
      const result = projectUtils.getTitleFromLocationsMeta(locations);
      expect(result).toContain('Region, Country');
    });

    it('escapes labels and dates, which anyone can send to the gallery', () => {
      const locations = JSON.stringify([
        {
          label: '<img src=x onerror=alert(1)> & Co',
          from: '"><script>',
          to: '2024-12-31',
        },
      ]);
      const result = projectUtils.getTitleFromLocationsMeta(locations);
      expect(result).not.toMatch(/<img|<script/);
      expect(result).toContain('from &quot;&gt;&lt;script&gt;');
      expect(result).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; Co');
    });
  });
});
