import { TrafficLight } from '../types/ride';
import { WeatherData, WeatherReason, UserPreferences } from '../types/weather';
import { HourlySlice } from './weather-api';

export interface BestWindow {
  start: string;   // "16:00"
  end: string;     // "19:00"
  status: 'green' | 'orange';
}

export function findBestRideWindow(hours: HourlySlice[], prefs: UserPreferences): BestWindow | null {
  if (!hours.length) return null;

  // Score each hour
  const scored = hours.map((h) => {
    const weather: WeatherData = {
      temperatureC: h.temperatureC,
      feelsLikeC: h.feelsLikeC,
      precipitationProbability: h.precipitationProbability,
      precipitationMm: h.precipitationMm,
      windSpeedKmh: h.windSpeedKmh,
      windGustsKmh: h.windGustsKmh,
    };
    return { hour: h.hour, status: calculateTrafficLight(weather, prefs).status };
  });

  // Find longest consecutive green run, then longest orange run
  for (const target of ['green', 'orange'] as const) {
    let best: { start: string; end: string; len: number } | null = null;
    let runStart = -1;

    for (let i = 0; i <= scored.length; i++) {
      const inRun = i < scored.length && scored[i].status === target;
      if (inRun && runStart === -1) { runStart = i; }
      if (!inRun && runStart !== -1) {
        const len = i - runStart;
        if (!best || len > best.len) {
          // end = start of NEXT hour after run
          const endIdx = Math.min(i, scored.length - 1);
          const endHour = i < scored.length ? scored[i].hour : addOneHour(scored[scored.length - 1].hour);
          best = { start: scored[runStart].hour, end: endHour, len };
        }
        runStart = -1;
      }
    }
    if (best) return { start: best.start, end: best.end, status: target };
  }
  return null;
}

function addOneHour(time: string): string {
  const [h] = time.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:00`;
}

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

/**
 * Normalises a value along a [greenThreshold, orangeThreshold] range → 0–10.
 *
 * Calibration guarantee: a score of N always means the same thing regardless
 * of factor — "N/10 of the way from the green threshold to the danger threshold."
 * Cross-factor comparisons are only fair if the threshold ranges themselves
 * represent equal urgency bands. Adjust URGENCY_MULTIPLIER below when real-world
 * data shows one factor is systematically over- or under-weighted.
 */
function proximityScore(value: number, greenLimit: number, orangeLimit: number, invert = false): number {
  const v = invert ? -value : value;
  const g = invert ? -greenLimit : greenLimit;
  const o = invert ? -orangeLimit : orangeLimit;
  if (o === g) return 10;
  return Math.min(10, Math.max(0, ((v - g) / (o - g)) * 10));
}

/**
 * Per-factor multipliers applied to proximity scores before comparison.
 * All 1.0 = equal calibration (current default).
 * Increase a factor to make it win more often at equal proximity;
 * decrease to make it yield. Tune based on real-world rider feedback.
 *
 * Example future tweak: { rain: 1.0, wind: 1.05, temperature: 0.9 }
 * if riders report wind is slightly under-reported at equal proximity.
 */
const URGENCY_MULTIPLIER: Record<string, number> = {
  rain:        1.0,
  wind:        1.0,
  temperature: 1.0,
};

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
      score: proximityScore(weather.precipitationProbability, thresholds.green.maxRainPct, thresholds.orange.maxRainPct),
    });
  } else if (weather.precipitationProbability > thresholds.green.maxRainPct) {
    reasons.push({
      factor: 'rain',
      label: `Kans op regen (${weather.precipitationProbability}%)`,
      severity: 'warning',
      score: proximityScore(weather.precipitationProbability, thresholds.green.maxRainPct, thresholds.orange.maxRainPct),
    });
  }

  // Neerslag mm (max over tijdslot — 0,0,3mm is wél nat)
  if (weather.precipitationMm > thresholds.orange.maxRainMm) {
    reasons.push({
      factor: 'rain',
      label: `Regen verwacht (${weather.precipitationMm.toFixed(1)} mm/u)`,
      severity: 'danger',
      score: proximityScore(weather.precipitationMm, thresholds.green.maxRainMm, thresholds.orange.maxRainMm),
    });
  } else if (weather.precipitationMm > thresholds.green.maxRainMm) {
    reasons.push({
      factor: 'rain',
      label: `Lichte neerslag (${weather.precipitationMm.toFixed(1)} mm/u)`,
      severity: 'warning',
      score: proximityScore(weather.precipitationMm, thresholds.green.maxRainMm, thresholds.orange.maxRainMm),
    });
  }

  // Wind (inclusief windstoten)
  if (wind > thresholds.orange.maxWindKmh) {
    reasons.push({
      factor: 'wind',
      label: `Harde wind + windstoten (${wind} km/u)`,
      severity: 'danger',
      score: proximityScore(wind, thresholds.green.maxWindKmh, thresholds.orange.maxWindKmh),
    });
  } else if (wind > thresholds.green.maxWindKmh) {
    reasons.push({
      factor: 'wind',
      label: `Stevige wind (${wind} km/u)`,
      severity: 'warning',
      score: proximityScore(wind, thresholds.green.maxWindKmh, thresholds.orange.maxWindKmh),
    });
  }

  // Temperatuur (inverted — lower temp = higher score)
  if (weather.temperatureC < thresholds.orange.minTempC) {
    reasons.push({
      factor: 'temperature',
      label: `Te koud om te rijden (${weather.temperatureC}°C)`,
      severity: 'danger',
      score: proximityScore(weather.temperatureC, thresholds.green.minTempC, thresholds.orange.minTempC, true),
    });
  } else if (weather.temperatureC < thresholds.green.minTempC) {
    reasons.push({
      factor: 'temperature',
      label: `Koud (${weather.temperatureC}°C)`,
      severity: 'warning',
      score: proximityScore(weather.temperatureC, thresholds.green.minTempC, thresholds.orange.minTempC, true),
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

/**
 * Returns a single short English verdict for display in cards and widgets.
 *
 * Style: decision-first, consistent register.
 *   green  → "Perfect conditions" (or "Mostly clear" at low confidence)
 *   orange → "Rain expected" / "Rain at 18:00" / "Strong winds" / "Cold — ride prepared"
 *   red    → "Heavy rain" / "Too windy to ride" / "Too cold to ride"
 *
 * Options:
 *   returnTime  — when provided, replaces "on return" with "at HH:MM" (more actionable)
 *   confidence  — 'low' softens warnings to "Possible …"
 */
export function summarizeRide(
  overallStatus: TrafficLight,
  reasons: WeatherReason[],
  options?: { returnTime?: string; confidence?: 'high' | 'medium' | 'low' },
): string {
  const { returnTime, confidence } = options ?? {};
  const isLowConf = confidence === 'low';

  if (overallStatus === 'green') return isLowConf ? 'Mostly clear' : 'Perfect conditions';

  // Sort by combined score: danger tier (100 offset) + proximity score (0–10).
  // Falls back to factor bias (rain=6, wind=5, temp=4) when score is absent,
  // preserving the old rain > wind > temperature default.
  const FACTOR_BIAS: Record<string, number> = { rain: 6, wind: 5, temperature: 4 };
  const totalScore = (r: WeatherReason) =>
    (r.severity === 'danger' ? 100 : 0) + (r.score ?? FACTOR_BIAS[r.factor] ?? 5);
  const ranked = [...reasons].sort((a, b) => totalScore(b) - totalScore(a));
  const primary = ranked[0] ?? null;
  if (!primary) return overallStatus === 'red' ? 'Check conditions' : 'Ride with caution';

  const onReturn = primary.label.startsWith('Terug:');
  const timeSuffix = onReturn
    ? returnTime ? ` at ${returnTime}` : ' on return'
    : '';

  switch (primary.factor) {
    case 'rain':
      if (primary.severity === 'danger') return `Heavy rain${timeSuffix}`;
      return isLowConf ? `Possible rain${timeSuffix}` : `Rain expected${timeSuffix}`;
    case 'wind':
      if (primary.severity === 'danger') return `Too windy to ride${timeSuffix}`;
      return isLowConf ? `Possible strong winds${timeSuffix}` : `Strong winds${timeSuffix}`;
    case 'temperature':
      if (primary.severity === 'danger') return 'Too cold to ride';
      return 'Cold — ride prepared';
    default:
      return overallStatus === 'red' ? 'Check conditions' : 'Ride with caution';
  }
}

/**
 * Scores a ride with two separate weather checks: outbound (heen) and return (terug).
 * Overall status = worst of the two legs.
 */
export function calculateRideScore(
  outbound: WeatherData,
  returns: WeatherData,
  prefs: UserPreferences,
): {
  overallStatus: TrafficLight;
  outboundStatus: TrafficLight;
  returnStatus: TrafficLight;
  reasons: WeatherReason[];
} {
  const { status: outboundStatus, reasons: outboundReasons } = calculateTrafficLight(outbound, prefs);
  const { status: returnStatus, reasons: returnReasons } = calculateTrafficLight(returns, prefs);

  // Tag reasons with which leg they belong to
  const taggedOutbound = outboundReasons.map((r) => ({ ...r, label: `Heen: ${r.label}` }));
  const taggedReturn = returnReasons.map((r) => ({ ...r, label: `Terug: ${r.label}` }));

  const rank: Record<TrafficLight, number> = { green: 0, orange: 1, red: 2 };
  const overallStatus: TrafficLight =
    rank[outboundStatus] >= rank[returnStatus] ? outboundStatus : returnStatus;

  return {
    overallStatus,
    outboundStatus,
    returnStatus,
    reasons: [...taggedOutbound, ...taggedReturn],
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
