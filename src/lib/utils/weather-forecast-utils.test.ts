import { describe, expect, it } from 'vitest';
import { getWeatherCodeDetails } from './weather-forecast-utils';

describe('weather-forecast-utils', () => {
  describe('getWeatherCodeDetails', () => {
    it('should return Clear for code 0', () => {
      const result = getWeatherCodeDetails({
        weathercode: 0,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Clear');
      expect(result.icon).toContain('icon-CLEAR');
      expect(result.icon).not.toContain('night');
    });

    it('should return Clear (night) for code 0 when is_day is 0', () => {
      const result = getWeatherCodeDetails({
        weathercode: 0,
        is_day: 0,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Clear');
      expect(result.icon).toContain('icon-CLEARnight');
    });

    it('should return Mostly Clear for code 1', () => {
      const result = getWeatherCodeDetails({
        weathercode: 1,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Mostly Clear');
      expect(result.icon).toContain('icon-PCLOUDY');
    });

    it('should return Fog for code 45', () => {
      const result = getWeatherCodeDetails({
        weathercode: 45,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Fog');
      expect(result.icon).toContain('icon-FOGCLOUD');
    });

    it('should return Light Drizzle for code 51', () => {
      const result = getWeatherCodeDetails({
        weathercode: 51,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Light Drizzle');
      expect(result.icon).toContain('icon-DRIZZLE');
    });

    it('should return Slight Rain for code 61', () => {
      const result = getWeatherCodeDetails({
        weathercode: 61,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Slight Rain');
      expect(result.icon).toContain('icon-RAIN');
    });

    it('should return Slight Snow Fall for code 71', () => {
      const result = getWeatherCodeDetails({
        weathercode: 71,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Slight Snow Fall');
      expect(result.icon).toContain('icon-SNOW');
    });

    it('should return Slight Rain Showers for code 80', () => {
      const result = getWeatherCodeDetails({
        weathercode: 80,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Slight Rain Showers');
      expect(result.icon).toContain('icon-drizzle_rain');
    });

    it('should return Thunderstorms for code 95', () => {
      const result = getWeatherCodeDetails({
        weathercode: 95,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Thunderstorms');
      expect(result.icon).toContain('icon-thunderstorm_with_light_rain');
    });

    it('should include precipitation probability if provided', () => {
      const result = getWeatherCodeDetails({
        weathercode: 61,
        is_day: 1,
        precipitation_probability: 45,
      });
      expect(result.icon).toContain('45%');
      expect(result.icon).toContain('style="color:rgb(56, 189, 248)"');
    });

    it('should default to Clear for unknown codes', () => {
      const result = getWeatherCodeDetails({
        weathercode: 999,
        is_day: 1,
        precipitation_probability: 0,
      });
      expect(result.description).toBe('Clear');
      expect(result.icon).toContain('icon-CLEAR');
    });
  });
});
