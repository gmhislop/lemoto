import { calculateTrafficLight, calculateConfidence, calculateRideScore, summarizeRide } from '../lib/weather-score';
import { WeatherData, UserPreferences, DEFAULT_PREFERENCES } from '../types/weather';

const BASE_WEATHER: WeatherData = {
  temperatureC: 18,
  feelsLikeC: 16,
  precipitationProbability: 10,
  precipitationMm: 0.1,
  windSpeedKmh: 15,
  windGustsKmh: 18,
};

describe('calculateTrafficLight', () => {
  describe('green conditions', () => {
    it('returns green when all conditions are within default thresholds', () => {
      const { status } = calculateTrafficLight(BASE_WEATHER, DEFAULT_PREFERENCES);
      expect(status).toBe('green');
    });

    it('returns green with zero precipitation', () => {
      const weather = { ...BASE_WEATHER, precipitationProbability: 0, precipitationMm: 0 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('green');
    });
  });

  describe('orange conditions', () => {
    it('returns orange when rain probability exceeds green threshold', () => {
      const weather = { ...BASE_WEATHER, precipitationProbability: 35 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('orange');
    });

    it('returns orange when temperature is below minTempC but above orange threshold', () => {
      const weather = { ...BASE_WEATHER, temperatureC: 7 }; // below 10, above 5
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('orange');
    });

    it('returns orange when wind gusts exceed green but not orange threshold', () => {
      const weather = { ...BASE_WEATHER, windSpeedKmh: 15, windGustsKmh: 28 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('orange');
    });
  });

  describe('red conditions', () => {
    it('returns red when rain probability is very high', () => {
      const weather = { ...BASE_WEATHER, precipitationProbability: 80 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('red');
    });

    it('returns red when temperature is dangerously low', () => {
      const weather = { ...BASE_WEATHER, temperatureC: 2 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('red');
    });

    it('returns red when wind gusts exceed orange threshold', () => {
      const weather = { ...BASE_WEATHER, windGustsKmh: 60 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('red');
    });

    it('returns red when precipitation mm exceeds orange threshold', () => {
      const weather = { ...BASE_WEATHER, precipitationMm: 3 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('red');
    });
  });

  describe('uses wind gusts over wind speed', () => {
    it('uses gusts when they are higher than wind speed', () => {
      // speed is fine but gusts push it into red
      const weather = { ...BASE_WEATHER, windSpeedKmh: 10, windGustsKmh: 60 };
      const { status } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('red');
    });
  });

  describe('user preferences', () => {
    it('low rain tolerance lowers thresholds', () => {
      const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, rainTolerance: 'low' };
      // 15% is green under normal but orange under low
      const weather = { ...BASE_WEATHER, precipitationProbability: 15 };
      const { status } = calculateTrafficLight(weather, prefs);
      expect(status).toBe('orange');
    });

    it('high rain tolerance raises thresholds', () => {
      const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, rainTolerance: 'high' };
      // 25% would be orange under normal, but green under high
      const weather = { ...BASE_WEATHER, precipitationProbability: 25 };
      const { status } = calculateTrafficLight(weather, prefs);
      expect(status).toBe('green');
    });

    it('custom minTempC is respected', () => {
      const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, minTempC: 15 };
      const weather = { ...BASE_WEATHER, temperatureC: 12 }; // fine by default, orange under custom
      const { status } = calculateTrafficLight(weather, prefs);
      expect(status).toBe('orange');
    });

    it('custom maxWindKmh is respected', () => {
      const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, maxWindKmh: 10 };
      const weather = { ...BASE_WEATHER, windSpeedKmh: 15, windGustsKmh: 15 };
      const { status } = calculateTrafficLight(weather, prefs);
      expect(status).toBe('orange');
    });
  });

  describe('reasons', () => {
    it('returns no reasons for perfect conditions', () => {
      const { reasons } = calculateTrafficLight(BASE_WEATHER, DEFAULT_PREFERENCES);
      expect(reasons).toHaveLength(0);
    });

    it('returns a rain reason when precipitation is high', () => {
      const weather = { ...BASE_WEATHER, precipitationProbability: 60 };
      const { reasons } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      const rainReason = reasons.find((r) => r.factor === 'rain');
      expect(rainReason).toBeDefined();
      expect(rainReason?.severity).toBe('danger');
    });

    it('emits exactly one rain reason even when both probability and mm trigger', () => {
      const weather = { ...BASE_WEATHER, precipitationProbability: 60, precipitationMm: 2.0 };
      const { reasons } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(reasons.filter((r) => r.factor === 'rain')).toHaveLength(1);
    });

    it('rain reason uses mm label when mm score dominates probability score', () => {
      // mm at 1.2 (near danger threshold 1.5) → high score; pct at 25% (just above warn 20%) → low score
      const weather = { ...BASE_WEATHER, precipitationProbability: 25, precipitationMm: 1.2 };
      const { reasons } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      const rainReason = reasons.find((r) => r.factor === 'rain');
      expect(rainReason?.label).toMatch(/mm\/u/);
    });

    it('returns a wind reason with correct factor', () => {
      const weather = { ...BASE_WEATHER, windGustsKmh: 50 };
      const { reasons } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      const windReason = reasons.find((r) => r.factor === 'wind');
      expect(windReason).toBeDefined();
    });

    it('returns a temperature reason when cold', () => {
      const weather = { ...BASE_WEATHER, temperatureC: 3 };
      const { reasons } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      const tempReason = reasons.find((r) => r.factor === 'temperature');
      expect(tempReason).toBeDefined();
      expect(tempReason?.severity).toBe('danger');
    });
  });
});

describe('calculateRideScore', () => {
  const GOOD: WeatherData = { ...BASE_WEATHER };
  const BAD: WeatherData = { ...BASE_WEATHER, precipitationProbability: 80 }; // red

  it('returns green overall when both legs are green', () => {
    const { overallStatus, outboundStatus, returnStatus } = calculateRideScore(GOOD, GOOD, DEFAULT_PREFERENCES);
    expect(overallStatus).toBe('green');
    expect(outboundStatus).toBe('green');
    expect(returnStatus).toBe('green');
  });

  it('returns red overall when outbound is red', () => {
    const { overallStatus, outboundStatus } = calculateRideScore(BAD, GOOD, DEFAULT_PREFERENCES);
    expect(overallStatus).toBe('red');
    expect(outboundStatus).toBe('red');
  });

  it('returns red overall when return leg is red', () => {
    const { overallStatus, returnStatus } = calculateRideScore(GOOD, BAD, DEFAULT_PREFERENCES);
    expect(overallStatus).toBe('red');
    expect(returnStatus).toBe('red');
  });

  it('returns orange overall when one leg is orange and neither is red', () => {
    const ORANGE: WeatherData = { ...BASE_WEATHER, precipitationProbability: 35 };
    const { overallStatus } = calculateRideScore(GOOD, ORANGE, DEFAULT_PREFERENCES);
    expect(overallStatus).toBe('orange');
  });

  it('tags outbound reasons with "Heen:"', () => {
    const { reasons } = calculateRideScore(BAD, GOOD, DEFAULT_PREFERENCES);
    const heenReasons = reasons.filter((r) => r.label.startsWith('Heen:'));
    expect(heenReasons.length).toBeGreaterThan(0);
  });

  it('tags return reasons with "Terug:"', () => {
    const { reasons } = calculateRideScore(GOOD, BAD, DEFAULT_PREFERENCES);
    const terugReasons = reasons.filter((r) => r.label.startsWith('Terug:'));
    expect(terugReasons.length).toBeGreaterThan(0);
  });

  describe('advisory', () => {
    it('is undefined when both legs are equal', () => {
      const { advisory, advisoryType } = calculateRideScore(GOOD, GOOD, DEFAULT_PREFERENCES);
      expect(advisory).toBeUndefined();
      expect(advisoryType).toBeUndefined();
    });

    it('is undefined when outbound is worse than return', () => {
      const { advisory, advisoryType } = calculateRideScore(BAD, GOOD, DEFAULT_PREFERENCES);
      expect(advisory).toBeUndefined();
      expect(advisoryType).toBeUndefined();
    });

    it('is "Return conditions are dangerous" when outbound green and return red', () => {
      const { advisory, advisoryType } = calculateRideScore(GOOD, BAD, DEFAULT_PREFERENCES);
      expect(advisory).toBe('Return conditions are dangerous');
      expect(advisoryType).toBe('return_worse_than_outbound');
    });

    it('is "Return conditions are poor — plan accordingly" when outbound green and return orange', () => {
      const ORANGE: WeatherData = { ...BASE_WEATHER, precipitationProbability: 35 };
      const { advisory, advisoryType } = calculateRideScore(GOOD, ORANGE, DEFAULT_PREFERENCES);
      expect(advisory).toBe('Return conditions are poor — plan accordingly');
      expect(advisoryType).toBe('return_worse_than_outbound');
    });

    it('is "Return conditions are dangerous" when outbound orange and return red', () => {
      const ORANGE: WeatherData = { ...BASE_WEATHER, precipitationProbability: 35 };
      const { advisory, advisoryType } = calculateRideScore(ORANGE, BAD, DEFAULT_PREFERENCES);
      expect(advisory).toBe('Return conditions are dangerous');
      expect(advisoryType).toBe('return_worse_than_outbound');
    });
  });
});

describe('summarizeRide', () => {
  describe('green status', () => {
    it('returns "Perfect conditions" for green', () => {
      expect(summarizeRide('green', [])).toBe('Perfect conditions');
    });

    it('returns "Mostly clear" for green with low confidence', () => {
      expect(summarizeRide('green', [], { confidence: 'low' })).toBe('Mostly clear');
    });
  });

  describe('rain', () => {
    it('returns "Heavy rain" for a rain danger', () => {
      const reasons = [{ factor: 'rain' as const, label: 'Hoge kans op regen (80%)', severity: 'danger' as const }];
      expect(summarizeRide('red', reasons)).toBe('Heavy rain');
    });

    it('returns "Rain expected" for a rain warning without returnTime', () => {
      const reasons = [{ factor: 'rain' as const, label: 'Kans op regen (35%)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons)).toBe('Rain expected');
    });

    it('returns "Rain expected on return" for a Terug rain warning without returnTime', () => {
      const reasons = [{ factor: 'rain' as const, label: 'Terug: Kans op regen (35%)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons)).toBe('Rain expected on return');
    });

    it('returns "Rain expected at 19:00" for a Terug rain warning with returnTime', () => {
      const reasons = [{ factor: 'rain' as const, label: 'Terug: Kans op regen (35%)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons, { returnTime: '19:00' })).toBe('Rain expected at 19:00');
    });

    it('returns "Possible rain on return" at low confidence', () => {
      const reasons = [{ factor: 'rain' as const, label: 'Terug: Kans op regen (25%)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons, { confidence: 'low' })).toBe('Possible rain on return');
    });

    it('keeps "Heavy rain" even at low confidence (danger is never softened)', () => {
      const reasons = [{ factor: 'rain' as const, label: 'Hoge kans op regen (80%)', severity: 'danger' as const }];
      expect(summarizeRide('red', reasons, { confidence: 'low' })).toBe('Heavy rain');
    });
  });

  describe('wind', () => {
    it('returns "Too windy to ride" for a wind danger', () => {
      const reasons = [{ factor: 'wind' as const, label: 'Harde wind (60 km/u)', severity: 'danger' as const }];
      expect(summarizeRide('red', reasons)).toBe('Too windy to ride');
    });

    it('returns "Strong winds on return" for return wind warning without returnTime', () => {
      const reasons = [{ factor: 'wind' as const, label: 'Terug: Stevige wind (28 km/u)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons)).toBe('Strong winds on return');
    });

    it('returns "Strong winds at 20:00" for return wind warning with returnTime', () => {
      const reasons = [{ factor: 'wind' as const, label: 'Terug: Stevige wind (28 km/u)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons, { returnTime: '20:00' })).toBe('Strong winds at 20:00');
    });

    it('returns "Possible strong winds on return" at low confidence', () => {
      const reasons = [{ factor: 'wind' as const, label: 'Terug: Stevige wind (28 km/u)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons, { confidence: 'low' })).toBe('Possible strong winds on return');
    });
  });

  describe('temperature', () => {
    it('returns "Too cold to ride" for a temperature danger', () => {
      const reasons = [{ factor: 'temperature' as const, label: 'Te koud (2°C)', severity: 'danger' as const }];
      expect(summarizeRide('red', reasons)).toBe('Too cold to ride');
    });

    it('returns "Cold — ride prepared" for a temperature warning', () => {
      const reasons = [{ factor: 'temperature' as const, label: 'Koud (7°C)', severity: 'warning' as const }];
      expect(summarizeRide('orange', reasons)).toBe('Cold — ride prepared');
    });
  });

  describe('priority', () => {
    it('prioritises danger over warning', () => {
      const reasons = [
        { factor: 'temperature' as const, label: 'Koud (7°C)', severity: 'warning' as const },
        { factor: 'wind' as const, label: 'Harde wind (60 km/u)', severity: 'danger' as const },
      ];
      expect(summarizeRide('red', reasons)).toBe('Too windy to ride');
    });

    it('prioritises rain over wind when both are warnings and scores are equal', () => {
      // no score provided — falls back to factor bias (rain > wind)
      const reasons = [
        { factor: 'wind' as const, label: 'Stevige wind (28 km/u)', severity: 'warning' as const },
        { factor: 'rain' as const, label: 'Kans op regen (35%)', severity: 'warning' as const },
      ];
      expect(summarizeRide('orange', reasons)).toBe('Rain expected');
    });

    it('prioritises rain over wind when both are dangers and scores are equal', () => {
      const reasons = [
        { factor: 'wind' as const, label: 'Harde wind (60 km/u)', severity: 'danger' as const },
        { factor: 'rain' as const, label: 'Hoge kans op regen (80%)', severity: 'danger' as const },
      ];
      expect(summarizeRide('red', reasons)).toBe('Heavy rain');
    });

    it('lets wind beat rain when wind score is significantly higher', () => {
      // wind at score 9.5 (near danger threshold) beats rain at score 2 (mild)
      const reasons = [
        { factor: 'wind' as const, label: 'Stevige wind', severity: 'warning' as const, score: 9.5 },
        { factor: 'rain' as const, label: 'Kans op regen', severity: 'warning' as const, score: 2 },
      ];
      expect(summarizeRide('orange', reasons)).toBe('Strong winds');
    });

    it('wind beats rain via calculateTrafficLight when wind is near danger threshold and rain is light', () => {
      // Default thresholds: green wind = 20, orange wind = 35. Gusts at 34 → score ≈ 9.3
      // Rain pct: 25% is just above green (20%) → score ≈ 1.7
      const weather: WeatherData = {
        ...BASE_WEATHER,
        windSpeedKmh: 20,
        windGustsKmh: 34, // near danger threshold (35)
        precipitationProbability: 25, // light rain warning
        precipitationMm: 0.1,
      };
      const { status, reasons } = calculateTrafficLight(weather, DEFAULT_PREFERENCES);
      expect(status).toBe('orange');
      const summary = summarizeRide(status, reasons);
      expect(summary).toBe('Strong winds');
    });
  });
});

describe('calculateConfidence', () => {
  function daysFromToday(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  it('returns high for today', () => {
    expect(calculateConfidence(daysFromToday(0))).toBe('high');
  });

  it('returns high for tomorrow', () => {
    expect(calculateConfidence(daysFromToday(1))).toBe('high');
  });

  it('returns medium for 2 days ahead', () => {
    expect(calculateConfidence(daysFromToday(2))).toBe('medium');
  });

  it('returns medium for 3 days ahead', () => {
    expect(calculateConfidence(daysFromToday(3))).toBe('medium');
  });

  it('returns low for 4+ days ahead', () => {
    expect(calculateConfidence(daysFromToday(4))).toBe('low');
  });

  it('returns low for a week ahead', () => {
    expect(calculateConfidence(daysFromToday(7))).toBe('low');
  });
});
