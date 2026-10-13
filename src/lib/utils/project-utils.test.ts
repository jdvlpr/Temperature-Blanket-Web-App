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
    const answer = (response: unknown) =>
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ json: async () => response })),
      );

    it('gives the new page, as text', async () => {
      answer({
        code: 200,
        link: 'https://example.test/gallery/1',
        title: 'Ottawa &amp; Paris',
      });
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'sent',
        link: 'https://example.test/gallery/1',
        linked: false,
        oldRemoved: null,
      });
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
        oldRemoved: false,
      });
    });

    it("passes WordPress's message along as text", async () => {
      answer({ code: 500, message: 'Image upload error' });
      expect(await projectUtils.sendToProjectGallery('img')).toEqual({
        status: 'error',
        message: 'Image upload error',
        oldRemoved: false,
      });
    });

    it('sends a guest submission with a new Turnstile token', async () => {
      answer({ code: 200, link: 'https://example.test/gallery/3' });
      const steps: string[] = [];
      await projectUtils.sendToProjectGallery('img', {
        getGuestToken: async () => 'token',
        onStep: (step) => steps.push(step),
      });
      const [, init] = vi.mocked(fetch).mock.calls[0];
      expect(new Headers(init?.headers).get('CF-Turnstile-Response')).toBe(
        'token',
      );
      expect(steps).toEqual(['sending', 'checking', 'sending']);
    });

    it("says so when the check can't run, sending nothing", async () => {
      answer({ code: 200 });
      const result = await projectUtils.sendToProjectGallery('img', {
        getGuestToken: async () => {
          throw new Error('blocked');
        },
      });
      expect(result).toMatchObject({ status: 'error' });
      expect(result.status === 'error' && result.message).toMatch(/robot/);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('shares chosen palettes with each gauge’s own link, and reports them', async () => {
      const { gauges } = await import('#lib/state/gauges-state.svelte.js');
      const { buildGalleryRequestBody } =
        await import('#lib/utils/gallery-upload-utils.js');
      (gauges.allCreated as unknown[]).push({ colors: [], label: 'Temp' });
      vi.stubGlobal('window', { location: { origin: 'https://app.test' } });
      try {
        answer({
          code: 200,
          link: 'https://example.test/gallery/4',
          shared_palettes: {
            created: [{ id: 5, title: 'Warm &amp; bright' }],
            skipped: [{ title: 'Other', reason: 'duplicate', id: 6 }],
          },
        });
        const result = await projectUtils.sendToProjectGallery('img', {
          sharePalettes: [
            { gaugeIndex: 0, title: 'Warm & bright', paletteId: 'pal1' },
            // no such gauge: left out
            { gaugeIndex: 3, title: 'Missing' },
          ],
        });
        const data = vi.mocked(buildGalleryRequestBody).mock.calls.at(-1)?.[0];
        expect(data?.share_palettes).toEqual([
          {
            title: 'Warm & bright',
            yarn_url: 'https://app.test/yarn?s=code&f=details',
            palette_id: 'pal1',
          },
        ]);
        expect(result).toMatchObject({
          status: 'sent',
          palettes: {
            created: [{ id: 5, title: 'Warm & bright' }],
            skipped: [{ title: 'Other', reason: 'duplicate', id: 6 }],
          },
        });

        // An older plugin doesn't say: null, so the dialog can tell
        answer({ code: 200, link: 'https://example.test/gallery/7' });
        expect(
          await projectUtils.sendToProjectGallery('img', {
            sharePalettes: [{ gaugeIndex: 0, title: 'Warm' }],
          }),
        ).toMatchObject({ status: 'sent', palettes: null });
      } finally {
        (gauges.allCreated as unknown[]).length = 0;
        vi.unstubAllGlobals();
      }
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
