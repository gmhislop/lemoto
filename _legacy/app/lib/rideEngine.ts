import { WeatherData, WeatherForecast } from './weather';
import { UserPreferences } from '@/app/types/preferences';

export interface RideRecommendation {
  suitable: boolean;
  score: number; // 0-100
  reasons: string[];
  warnings: string[];
  bestTimeSlots?: string[];
}

export interface RideCheck {
  current: RideRecommendation;
  today: RideRecommendation;
  tomorrow?: RideRecommendation;
  nextRideWindow?: {
    date: string;
    time: string;
    reason: string;
  };
}

export class RideEngine {
  static checkWeatherSuitability(weather: WeatherData, preferences: UserPreferences): RideRecommendation {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Temperature check
    const { minTemperature, maxTemperature } = preferences.weather;
    if (weather.temperature < minTemperature) {
      reasons.push(`Too cold (${weather.temperature}°C < ${minTemperature}°C)`);
      score -= 30;
    }
    if (maxTemperature && weather.temperature > maxTemperature) {
      reasons.push(`Too hot (${weather.temperature}°C > ${maxTemperature}°C)`);
      score -= 20;
    }

    // Rain check
    if (weather.precipitation > 0 && !preferences.weather.allowRain) {
      reasons.push(`Rain detected (${weather.precipitation}mm/h)`);
      score -= 40;
    }

    // Wind check
    if (weather.windSpeed > preferences.weather.maxWindSpeed) {
      reasons.push(`Too windy (${weather.windSpeed} m/s > ${preferences.weather.maxWindSpeed} m/s)`);
      score -= 25;
    }

    // Storm check
    const stormConditions = ['thunderstorm', 'storm', 'tornado', 'hurricane'];
    if (preferences.weather.avoidStorm && 
        stormConditions.some(condition => weather.description.toLowerCase().includes(condition))) {
      reasons.push(`Storm conditions: ${weather.description}`);
      score -= 50;
    }

    // Add positive conditions
    if (weather.temperature >= minTemperature && 
        (!maxTemperature || weather.temperature <= maxTemperature)) {
      if (reasons.length === 0) {
        reasons.push(`Good temperature (${weather.temperature}°C)`);
      }
    }

    if (weather.precipitation === 0) {
      if (reasons.length === 0) {
        reasons.push('No rain');
      }
    }

    const suitable = score >= 60; // Threshold for suitable riding
    
    return {
      suitable,
      score: Math.max(0, score),
      reasons,
      warnings
    };
  }

  static checkScheduleSuitability(preferences: UserPreferences, targetDate: Date = new Date()): boolean {
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWeekday = !isWeekend;

    // Check if the day matches user preferences
    if (isWeekday && !preferences.schedule.weekdays) return false;
    if (isWeekend && !preferences.schedule.weekends) return false;

    // Check specific days if configured
    if (preferences.schedule.specificDays && preferences.schedule.specificDays.length > 0) {
      return preferences.schedule.specificDays.includes(dayOfWeek);
    }

    return true;
  }

  static checkTimeWindow(preferences: UserPreferences, targetTime: Date = new Date()): boolean {
    const currentHour = targetTime.getHours();
    const currentMinute = targetTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = preferences.schedule.endTime.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }

  static async analyzeRideConditions(
    weatherForecast: WeatherForecast, 
    preferences: UserPreferences
  ): Promise<RideCheck> {
    const now = new Date();
    
    // Check current conditions
    const currentWeatherCheck = this.checkWeatherSuitability(weatherForecast.current, preferences);
    const currentScheduleCheck = this.checkScheduleSuitability(preferences, now);
    const currentTimeCheck = this.checkTimeWindow(preferences, now);

    const current: RideRecommendation = {
      ...currentWeatherCheck,
      suitable: currentWeatherCheck.suitable && currentScheduleCheck && currentTimeCheck
    };

    if (!currentScheduleCheck) {
      current.reasons.push('Not in scheduled riding days');
    }
    if (!currentTimeCheck) {
      current.reasons.push('Not in scheduled riding hours');
    }

    // Analyze today's forecast
    const todayForecasts = weatherForecast.forecast.filter(f => {
      const forecastDate = new Date(f.timestamp * 1000);
      return forecastDate.getDate() === now.getDate();
    });

    let bestTodayScore = 0;
    let bestTodayReasons: string[] = [];
    const bestTimeSlots: string[] = [];

    todayForecasts.forEach(forecast => {
      const forecastTime = new Date(forecast.timestamp * 1000);
      if (this.checkTimeWindow(preferences, forecastTime)) {
        const weatherCheck = this.checkWeatherSuitability(forecast, preferences);
        if (weatherCheck.score > bestTodayScore) {
          bestTodayScore = weatherCheck.score;
          bestTodayReasons = weatherCheck.reasons;
        }
        if (weatherCheck.suitable) {
          bestTimeSlots.push(`${forecastTime.getHours()}:00`);
        }
      }
    });

    const today: RideRecommendation = {
      suitable: bestTodayScore >= 60 && currentScheduleCheck,
      score: bestTodayScore,
      reasons: bestTodayReasons,
      warnings: [],
      bestTimeSlots
    };

    // Find next suitable ride window
    let nextRideWindow = undefined;
    for (const forecast of weatherForecast.forecast) {
      const forecastDate = new Date(forecast.timestamp * 1000);
      if (forecastDate <= now) continue;

      const weatherCheck = this.checkWeatherSuitability(forecast, preferences);
      const scheduleCheck = this.checkScheduleSuitability(preferences, forecastDate);
      const timeCheck = this.checkTimeWindow(preferences, forecastDate);

      if (weatherCheck.suitable && scheduleCheck && timeCheck) {
        nextRideWindow = {
          date: forecastDate.toLocaleDateString(),
          time: forecastDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          reason: weatherCheck.reasons.join(', ')
        };
        break;
      }
    }

    return {
      current,
      today,
      nextRideWindow
    };
  }
}