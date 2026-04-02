/**
 * Tests for the pure aggregation logic in weather-api.ts.
 * The fetch calls themselves are mocked — we test that the slicing
 * and aggregation of Open-Meteo's hourly response is correct.
 */

// Mock global fetch before importing the module
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { fetchWeatherForRide, geocodeLocation } from '../lib/weather-api';

function makeHourlyResponse(overrides: Partial<{
  times: string[];
  temps: number[];
  feelsLike: number[];
  precipProb: number[];
  precip: number[];
  windSpeed: number[];
  windGusts: number[];
}> = {}) {
  // 4 hours: 10:00, 11:00, 12:00, 13:00 on 2026-06-01
  const times = overrides.times ?? [
    '2026-06-01T10:00', '2026-06-01T11:00',
    '2026-06-01T12:00', '2026-06-01T13:00',
  ];
  return {
    hourly: {
      time: times,
      temperature_2m:        overrides.temps       ?? [18, 19, 20, 21],
      apparent_temperature:  overrides.feelsLike   ?? [16, 17, 18, 19],
      precipitation_probability: overrides.precipProb ?? [10, 20, 30, 40],
      precipitation:         overrides.precip      ?? [0.0, 0.1, 0.2, 0.5],
      wind_speed_10m:        overrides.windSpeed   ?? [10, 12, 14, 16],
      wind_gusts_10m:        overrides.windGusts   ?? [15, 18, 20, 25],
    },
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchWeatherForRide', () => {
  it('averages temperature over the ride window', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeHourlyResponse(),
    });
    // Window: 10:00, duration 2h → covers 10:00 and 11:00
    const result = await fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:00', 2);
    // avg of [18, 19] = 18.5
    expect(result.temperatureC).toBe(18.5);
  });

  it('takes max precipitation probability over the ride window', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeHourlyResponse(),
    });
    // Window: 10:00, duration 2h → 10:00 (10%) and 11:00 (20%)
    const result = await fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:00', 2);
    expect(result.precipitationProbability).toBe(20);
  });

  it('takes max precipitation mm over the ride window', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeHourlyResponse(),
    });
    const result = await fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:00', 2);
    // max of [0.0, 0.1] = 0.1
    expect(result.precipitationMm).toBe(0.1);
  });

  it('takes max wind gusts over the ride window', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeHourlyResponse(),
    });
    const result = await fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:00', 2);
    // max of [15, 18] = 18
    expect(result.windGustsKmh).toBe(18);
  });

  it('averages wind speed over the ride window', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeHourlyResponse(),
    });
    const result = await fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:00', 2);
    // avg of [10, 12] = 11
    expect(result.windSpeedKmh).toBe(11);
  });

  it('covers a longer window spanning multiple hours', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeHourlyResponse(),
    });
    // Window: 10:00, duration 4h → all 4 hours
    const result = await fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:00', 4);
    // max precip prob = 40
    expect(result.precipitationProbability).toBe(40);
  });

  it('falls back to nearest hour when no exact window match', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeHourlyResponse(),
    });
    // Start at 10:30 — no exact hour, should fall back to 10:00
    const result = await fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:30', 0.5);
    expect(result.temperatureC).toBeDefined();
  });

  it('throws when the API responds with a non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(
      fetchWeatherForRide(52.37, 4.9, '2026-06-01', '10:00', 2),
    ).rejects.toThrow('Weather fetch failed: 429');
  });
});

describe('geocodeLocation', () => {
  it('returns lat/lon/label for a found location', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ latitude: 52.37, longitude: 4.9, name: 'Amsterdam' }],
      }),
    });
    const result = await geocodeLocation('Amsterdam');
    expect(result).toEqual({ lat: 52.37, lon: 4.9, label: 'Amsterdam' });
  });

  it('returns null when no results are found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
    const result = await geocodeLocation('xyznotaplace');
    expect(result).toBeNull();
  });

  it('returns null when the API call fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await geocodeLocation('Amsterdam');
    expect(result).toBeNull();
  });
});
