import { Ride } from '../types/ride';

const now = new Date().toISOString();

export const SEED_RIDES: Ride[] = [
  {
    id: 'seed-1',
    label: 'Woon-werk',
    date: '2026-04-03',
    startTime: '08:00',
    durationHours: 1,
    location: { lat: 52.37, lon: 4.9, label: 'Amsterdam' },
    status: 'green',
    confidence: 'high',
    reasons: [],
    weatherData: {
      precipitationProbability: 5,
      precipitationMm: 0.0,
      windSpeedKmh: 12,
      windGustsKmh: 16,
      temperatureC: 15,
      feelsLikeC: 13,
    },
    fetchedAt: now,
  },
  {
    id: 'seed-2',
    label: 'Weekendrit',
    date: '2026-04-05',
    startTime: '10:00',
    durationHours: 3,
    location: { lat: 51.91, lon: 4.47, label: 'Rotterdam' },
    status: 'orange',
    confidence: 'medium',
    reasons: [
      { factor: 'rain', label: 'Kans op regen (35%)', severity: 'warning' },
      { factor: 'wind', label: 'Stevige wind (24 km/u)', severity: 'warning' },
    ],
    weatherData: {
      precipitationProbability: 35,
      precipitationMm: 0.3,
      windSpeedKmh: 24,
      windGustsKmh: 33,
      temperatureC: 11,
      feelsLikeC: 8,
    },
    fetchedAt: now,
  },
  {
    id: 'seed-3',
    label: 'Avondrit Utrecht',
    date: '2026-04-08',
    startTime: '19:00',
    durationHours: 2,
    location: { lat: 52.09, lon: 5.11, label: 'Utrecht' },
    status: 'red',
    confidence: 'low',
    reasons: [
      { factor: 'rain', label: 'Hoge kans op regen (68%)', severity: 'danger' },
      { factor: 'rain', label: 'Regen verwacht (2.4 mm/u)', severity: 'danger' },
      { factor: 'temperature', label: 'Te koud om te rijden (3°C)', severity: 'danger' },
    ],
    weatherData: {
      precipitationProbability: 68,
      precipitationMm: 2.4,
      windSpeedKmh: 28,
      windGustsKmh: 41,
      temperatureC: 3,
      feelsLikeC: 0,
    },
    fetchedAt: now,
  },
];
