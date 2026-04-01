import { WeatherData, WeatherReason } from './weather';

export type TrafficLight = 'green' | 'orange' | 'red';

export interface Ride {
  id: string;           // uuid
  label: string;        // bijv. "Woon-werk" of "Weekendrit"
  date: string;         // ISO 8601 datum: "2025-06-14"
  startTime: string;    // "18:00"
  durationHours: number; // 1 | 1.5 | 2 | 3
  location: {
    lat: number;
    lon: number;
    label: string;      // bijv. "Amsterdam"
  };
  status?: TrafficLight;
  confidence?: 'high' | 'medium' | 'low';
  reasons?: WeatherReason[];
  weatherData?: WeatherData;
  fetchedAt?: string;
}
