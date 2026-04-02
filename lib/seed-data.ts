import { Ride } from '../types/ride';

// No fetchedAt — home screen will fetch real weather on first load
export const SEED_RIDES: Ride[] = [
  {
    id: 'seed-1',
    label: 'Woon-werk',
    date: '2026-04-03',
    startTime: '08:00',
    durationHours: 1,
    location: { lat: 52.37, lon: 4.9, label: 'Amsterdam' },
  },
  {
    id: 'seed-2',
    label: 'Weekendrit',
    date: '2026-04-05',
    startTime: '10:00',
    durationHours: 3,
    location: { lat: 51.91, lon: 4.47, label: 'Rotterdam' },
  },
  {
    id: 'seed-3',
    label: 'Avondrit Utrecht',
    date: '2026-04-08',
    startTime: '19:00',
    durationHours: 2,
    location: { lat: 52.09, lon: 5.11, label: 'Utrecht' },
  },
];
