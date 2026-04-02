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
  status?: TrafficLight;           // overall = worst of outbound/return
  outboundStatus?: TrafficLight;   // heen — weather at departure
  returnStatus?: TrafficLight;     // terug — weather at return
  confidence?: 'high' | 'medium' | 'low';
  reasons?: WeatherReason[];
  weatherData?: WeatherData;       // outbound weather
  returnWeatherData?: WeatherData; // return weather
  fetchedAt?: string;
  recurringId?: string;            // set when generated from a RecurringRide rule
}
