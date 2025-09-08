'use client';

import { WeatherData } from '@/app/lib/weather';

interface WeatherSummaryProps {
  weather: WeatherData;
}

export default function WeatherSummary({ weather }: WeatherSummaryProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWindSpeedDescription = (speed: number) => {
    if (speed < 3) return 'Light';
    if (speed < 7) return 'Moderate';
    if (speed < 12) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Current Weather</h3>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-bold">{Math.round(weather.temperature)}°C</p>
          <p className="text-gray-600 capitalize">{weather.description}</p>
          <p className="text-sm text-gray-500">
            Updated at {formatTime(weather.timestamp)}
          </p>
        </div>
        <div className="text-4xl">
          <img 
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="w-16 h-16"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Humidity</span>
            <span className="font-semibold">{weather.humidity}%</span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Rain</span>
            <span className="font-semibold">
              {weather.precipitation > 0 ? `${weather.precipitation}mm/h` : 'None'}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded p-3 col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Wind</span>
            <span className="font-semibold">
              {weather.windSpeed} m/s ({getWindSpeedDescription(weather.windSpeed)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}