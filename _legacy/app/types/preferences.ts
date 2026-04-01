export interface RidingSchedule {
  weekdays: boolean;
  weekends: boolean;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  specificDays?: number[]; // Day of week (0-6, Sunday=0)
}

export interface WeatherPreferences {
  minTemperature: number;  // Celsius
  maxTemperature?: number; // Celsius
  allowRain: boolean;
  maxWindSpeed: number;    // m/s
  avoidStorm: boolean;
}

export interface UserPreferences {
  id?: string;
  userId: string;
  schedule: RidingSchedule;
  weather: WeatherPreferences;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  notifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  schedule: {
    weekdays: true,
    weekends: false,
    startTime: '07:00',
    endTime: '19:00'
  },
  weather: {
    minTemperature: 10,
    allowRain: false,
    maxWindSpeed: 15,
    avoidStorm: true
  },
  location: {
    latitude: 0,
    longitude: 0
  },
  notifications: true
};