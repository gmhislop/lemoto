import { TrafficLight } from '../types/ride';
import { WeatherData, WeatherReason, UserPreferences } from '../types/weather';

// Drempelwaarden — overschrijfbaar via UserPreferences
const BASE_THRESHOLDS = {
  green:  { maxRainPct: 20, maxRainMm: 0.5, maxWindKmh: 20, minTempC: 10 },
  orange: { maxRainPct: 50, maxRainMm: 1.5, maxWindKmh: 35, minTempC: 5  },
};

function buildThresholds(prefs: UserPreferences) {
  // Deep copy so we don't mutate the original
  const t = {
    green:  { ...BASE_THRESHOLDS.green },
    orange: { ...BASE_THRESHOLDS.orange },
  };

  // Temperatuur
  t.green.minTempC  = prefs.minTempC;
  t.orange.minTempC = prefs.minTempC - 5;

  // Wind
  t.green.maxWindKmh  = prefs.maxWindKmh;
  t.orange.maxWindKmh = prefs.maxWindKmh + 15;

  // Regen tolerantie
  if (prefs.rainTolerance === 'low') {
    t.green.maxRainPct  = 10;  t.green.maxRainMm  = 0.2;
    t.orange.maxRainPct = 30;  t.orange.maxRainMm = 0.8;
  } else if (prefs.rainTolerance === 'high') {
    t.green.maxRainPct  = 35;  t.green.maxRainMm  = 1.0;
    t.orange.maxRainPct = 70;  t.orange.maxRainMm = 3.0;
  }

  return t;
}

// Wind: gebruik windstoten als die hoger zijn — voorkomt "false greens"
function effectiveWind(weather: WeatherData): number {
  return Math.max(weather.windSpeedKmh, weather.windGustsKmh);
}

function generateReasons(
  weather: WeatherData,
  thresholds: ReturnType<typeof buildThresholds>,
): WeatherReason[] {
  const reasons: WeatherReason[] = [];
  const wind = effectiveWind(weather);

  // Regen kans
  if (weather.precipitationProbability > thresholds.orange.maxRainPct) {
    reasons.push({
      factor: 'rain',
      label: `Hoge kans op regen (${weather.precipitationProbability}%)`,
      severity: 'danger',
    });
  } else if (weather.precipitationProbability > thresholds.green.maxRainPct) {
    reasons.push({
      factor: 'rain',
      label: `Kans op regen (${weather.precipitationProbability}%)`,
      severity: 'warning',
    });
  }

  // Neerslag mm (max over tijdslot — 0,0,3mm is wél nat)
  if (weather.precipitationMm > thresholds.orange.maxRainMm) {
    reasons.push({
      factor: 'rain',
      label: `Regen verwacht (${weather.precipitationMm.toFixed(1)} mm/u)`,
      severity: 'danger',
    });
  } else if (weather.precipitationMm > thresholds.green.maxRainMm) {
    reasons.push({
      factor: 'rain',
      label: `Lichte neerslag (${weather.precipitationMm.toFixed(1)} mm/u)`,
      severity: 'warning',
    });
  }

  // Wind (inclusief windstoten)
  if (wind > thresholds.orange.maxWindKmh) {
    reasons.push({
      factor: 'wind',
      label: `Harde wind + windstoten (${wind} km/u)`,
      severity: 'danger',
    });
  } else if (wind > thresholds.green.maxWindKmh) {
    reasons.push({
      factor: 'wind',
      label: `Stevige wind (${wind} km/u)`,
      severity: 'warning',
    });
  }

  // Temperatuur
  if (weather.temperatureC < thresholds.orange.minTempC) {
    reasons.push({
      factor: 'temperature',
      label: `Te koud om te rijden (${weather.temperatureC}°C)`,
      severity: 'danger',
    });
  } else if (weather.temperatureC < thresholds.green.minTempC) {
    reasons.push({
      factor: 'temperature',
      label: `Koud (${weather.temperatureC}°C)`,
      severity: 'warning',
    });
  }

  return reasons;
}

export function calculateTrafficLight(
  weather: WeatherData,
  prefs: UserPreferences,
): { status: TrafficLight; reasons: WeatherReason[] } {
  const thresholds = buildThresholds(prefs);
  const wind = effectiveWind(weather);

  const isRed =
    weather.precipitationProbability > thresholds.orange.maxRainPct ||
    weather.precipitationMm          > thresholds.orange.maxRainMm  ||
    wind                             > thresholds.orange.maxWindKmh ||
    weather.temperatureC             < thresholds.orange.minTempC;

  if (isRed) {
    return { status: 'red', reasons: generateReasons(weather, thresholds) };
  }

  const isOrange =
    weather.precipitationProbability > thresholds.green.maxRainPct ||
    weather.precipitationMm          > thresholds.green.maxRainMm  ||
    wind                             > thresholds.green.maxWindKmh ||
    weather.temperatureC             < thresholds.green.minTempC;

  return {
    status: isOrange ? 'orange' : 'green',
    reasons: generateReasons(weather, thresholds),
  };
}

// Betrouwbaarheid van de voorspelling op basis van hoe ver de rit in de toekomst ligt
export function calculateConfidence(rideDate: string): 'high' | 'medium' | 'low' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ride = new Date(rideDate);
  ride.setHours(0, 0, 0, 0);
  const daysAhead = Math.round((ride.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAhead <= 1) return 'high';
  if (daysAhead <= 3) return 'medium';
  return 'low';
}
