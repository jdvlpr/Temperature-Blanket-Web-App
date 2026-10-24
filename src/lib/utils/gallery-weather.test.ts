import { describe, expect, it } from 'vitest';
import {
  fromGalleryLink,
  FROM_GALLERY_PARAM,
  parseFromGallery,
} from './gallery-request';
import {
  galleryWeatherToLoad,
  isCustomGalleryWeather,
  type GalleryWeather,
} from './gallery-weather';

const value = (metric: number | null) => ({
  metric,
  imperial: metric === null ? null : metric * 2,
});

// Days as Send to Gallery stores them, for location 0 unless given
const storedDays = (dates: string[], location = 0) =>
  dates.map((date) => ({
    location,
    date: `${date}T00:00:00.000Z`,
    tavg: value(10),
    tmin: value(5),
    tmax: value(15),
    prcp: value(0),
    snow: value(null),
    dayt: value(600),
    moon: 'full',
  }));

const OPEN_METEO = JSON.stringify([
  { name: 'Open-Meteo', url: 'https://open-meteo.com' },
]);
const CUSTOM = JSON.stringify([
  { name: 'Open-Meteo', url: 'https://open-meteo.com' },
  { name: 'custom weather data' },
]);

const page = (
  days: unknown[],
  { weatherSources = OPEN_METEO, dateGmt = '2026-10-13T01:44:43' } = {},
): GalleryWeather => ({
  rawWeatherData: JSON.stringify(days),
  weatherSources,
  dateGmt,
});

const ONE_LOCATION = [{ from: '2025-01-01', to: '2025-01-03' }] as const;
const DAYS = storedDays(['2025-01-01', '2025-01-02', '2025-01-03']);

describe('galleryWeatherToLoad', () => {
  it('loads days that fit the locations, as dates', () => {
    const days = galleryWeatherToLoad(page(DAYS), [...ONE_LOCATION]);
    expect(days).toHaveLength(3);
    expect(days?.[0].date).toEqual(new Date(Date.UTC(2025, 0, 1)));
    expect(days?.[2].tavg).toEqual({ metric: 10, imperial: 20 });
  });

  it('loads each of several locations', () => {
    const days = galleryWeatherToLoad(
      page([...DAYS, ...storedDays(['2024-06-01', '2024-06-02'], 1)]),
      [...ONE_LOCATION, { from: '2024-06-01', to: '2024-06-02' }],
    );
    expect(days).toHaveLength(5);
  });

  it('leaves a page without weather to a search', () => {
    for (const rawWeatherData of ['', null, '[]', 'not json', '{}'])
      expect(
        galleryWeatherToLoad({ ...page(DAYS), rawWeatherData }, [
          ...ONE_LOCATION,
        ]),
      ).toBeNull();
  });

  it('leaves weather of an unknown shape to a search', () => {
    const [first, ...rest] = DAYS;
    expect(
      galleryWeatherToLoad(page([{ ...first, tavg: 10 }, ...rest]), [
        ...ONE_LOCATION,
      ]),
    ).toBeNull();
  });

  it("leaves weather that doesn't fit the locations' dates", () => {
    expect(
      galleryWeatherToLoad(page(DAYS), [
        { from: '2025-01-01', to: '2025-01-04' },
      ]),
    ).toBeNull();
    expect(
      galleryWeatherToLoad(page(DAYS), [
        ...ONE_LOCATION,
        { from: '2024-06-01', to: '2024-06-02' },
      ]),
    ).toBeNull();
    expect(
      galleryWeatherToLoad(page([...DAYS, ...storedDays(['2024-06-01'], 1)]), [
        ...ONE_LOCATION,
      ]),
    ).toBeNull();
  });

  it('loads a blanket published while in progress, custom or not', () => {
    for (const weatherSources of [OPEN_METEO, CUSTOM])
      expect(
        galleryWeatherToLoad(
          page(DAYS, { weatherSources, dateGmt: '2025-01-02T10:00:00' }),
          [...ONE_LOCATION],
        ),
      ).toHaveLength(3);
  });
});

describe('isCustomGalleryWeather', () => {
  it('finds the custom weather source', () => {
    expect(isCustomGalleryWeather(CUSTOM)).toBe(true);
    expect(isCustomGalleryWeather(OPEN_METEO)).toBe(false);
    expect(isCustomGalleryWeather(null)).toBe(false);
    expect(isCustomGalleryWeather('')).toBe(false);
  });
});

describe('fromGalleryLink', () => {
  it('names the gallery page, keeping the rest of the link', () => {
    const href =
      'https://example.com/?project=123&v=7.0.0#l=1,20250101,!&u=m&m=Name';
    const url = new URL(fromGalleryLink(href, 32788));
    expect(parseFromGallery(url.searchParams.get(FROM_GALLERY_PARAM))).toBe(
      32788,
    );
    expect(url.searchParams.get('project')).toBe('123');
    expect(url.hash).toBe(new URL(href).hash);
  });

  it('ignores anything but a post ID', () => {
    for (const value of [null, '', '0', 'abc', '12x'])
      expect(parseFromGallery(value)).toBeNull();
  });
});
