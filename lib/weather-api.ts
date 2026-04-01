import { WeatherData } from '../types/weather';

const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1';
const WEATHER_BASE = 'https://api.open-meteo.com/v1';

export async function geocodeLocation(
  name: string,
): Promise<{ lat: number; lon: number; label: string } | null> {
  const url = `${GEO_BASE}/search?name=${encodeURIComponent(name)}&count=1&language=nl&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results?.length) return null;
  const r = data.results[0];
  return { lat: r.latitude, lon: r.longitude, label: r.name };
}

export async function fetchWeatherForRide(
  lat: number,
  lon: number,
  date: string,       // "2025-06-14"
  startTime: string,  // "18:00"
  durationHours: number,
): Promise<WeatherData> {
  const url =
    `${WEATHER_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m` +
    `&timezone=auto&forecast_days=16`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const data = await res.json();

  const startDt = new Date(`${date}T${startTime}:00`);
  const endDt = new Date(startDt.getTime() + durationHours * 60 * 60 * 1000);

  const times: string[] = data.hourly.time;
  const temps: number[] = data.hourly.temperature_2m;
  const feelsLike: number[] = data.hourly.apparent_temperature;
  const precipProb: number[] = data.hourly.precipitation_probability;
  const precip: number[] = data.hourly.precipitation;
  const windSpeed: number[] = data.hourly.wind_speed_10m;
  const windGusts: number[] = data.hourly.wind_gusts_10m;

  // Collect indices that fall within the ride window (inclusive)
  const indices = times.reduce<number[]>((acc, t, i) => {
    const dt = new Date(t);
    if (dt >= startDt && dt < endDt) acc.push(i);
    return acc;
  }, []);

  // Fall back to the single nearest hour if window is < 1h or lands in a gap
  if (!indices.length) {
    const nearest = times.reduce((best, t, i) => {
      const diff = Math.abs(new Date(t).getTime() - startDt.getTime());
      return diff < best.diff ? { i, diff } : best;
    }, { i: 0, diff: Infinity });
    indices.push(nearest.i);
  }

  const avg = (arr: number[]) =>
    Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
  const max = (arr: number[]) => Math.max(...arr);

  const slice = <T>(arr: T[]) => indices.map((i) => arr[i]);

  return {
    temperatureC: avg(slice(temps)),
    feelsLikeC: avg(slice(feelsLike)),
    precipitationProbability: max(slice(precipProb)),
    precipitationMm: Math.round(max(slice(precip)) * 10) / 10,
    windSpeedKmh: Math.round(avg(slice(windSpeed))),
    windGustsKmh: Math.round(max(slice(windGusts))),
  };
}
