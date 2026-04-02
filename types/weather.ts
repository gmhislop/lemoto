export interface WeatherData {
  precipitationProbability: number; // 0–100 (%) — max over tijdslot
  precipitationMm: number;          // mm per uur — max over tijdslot
  windSpeedKmh: number;             // km/u — gemiddelde over tijdslot
  windGustsKmh: number;             // km/u — max over tijdslot
  temperatureC: number;             // °C — gemiddelde over tijdslot
  feelsLikeC: number;               // °C — gemiddelde over tijdslot
}

export interface WeatherReason {
  factor: 'rain' | 'wind' | 'temperature';
  label: string;    // bijv. "Kans op regen (45%)"
  severity: 'ok' | 'warning' | 'danger';
  /**
   * 0–10 — how far the value sits along the warning→danger range.
   * 10 = at or above the danger threshold.
   * Used by summarizeRide to rank reasons within the same severity tier.
   * Optional so test fixtures and tagged reasons don't need to carry it.
   */
  score?: number;
}

export interface UserPreferences {
  minTempC: number;       // default 10
  maxWindKmh: number;     // default 20
  rainTolerance: 'low' | 'normal' | 'high';
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  minTempC: 10,
  maxWindKmh: 20,
  rainTolerance: 'normal',
};
