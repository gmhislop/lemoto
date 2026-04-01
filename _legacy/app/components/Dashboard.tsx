'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import RideSuitabilityIndicator from './RideSuitabilityIndicator';
import WeatherSummary from './WeatherSummary';
import { WeatherForecast } from '@/app/lib/weather';
import { RideCheck } from '@/app/lib/rideEngine';

interface DashboardProps {
  user: User;
}

interface WeatherResponse {
  weather: WeatherForecast;
  rideAnalysis: RideCheck;
  location: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

export default function Dashboard({ user }: DashboardProps) {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeatherData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/weather');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weather data');
      }
      
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-6"></div>
          <p className="text-[17px] text-gray-700 font-medium">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-3xl border border-red-200 p-8 text-center">
            <div className="text-red-500 text-5xl mb-6">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">Weather Error</h2>
            <p className="text-[17px] text-gray-700 mb-8 leading-relaxed">{error}</p>
            <button
              onClick={fetchWeatherData}
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-200 font-medium text-[15px]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-3xl border border-yellow-200 p-8 text-center">
            <div className="text-yellow-500 text-5xl mb-6">⚙️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">Setup Required</h2>
            <p className="text-[17px] text-gray-700 mb-8 leading-relaxed">
              Configure your location and preferences to get started with personalized ride recommendations.
            </p>
            <button 
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-200 font-medium text-[15px]"
              onClick={() => window.location.href = '/app/settings'}
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Lemoto</h1>
              <p className="text-[17px] text-gray-600 font-normal">Welcome back, {user.email}</p>
            </div>
            <button
              onClick={fetchWeatherData}
              className="bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 font-medium text-[15px]"
            >
              <span>🔄</span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Current Ride Status */}
          <RideSuitabilityIndicator 
            recommendation={weatherData.rideAnalysis.current}
            title="Right Now"
          />
          
          {/* Weather Summary */}
          <WeatherSummary weather={weatherData.weather.current} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Today's Overall */}
          <RideSuitabilityIndicator 
            recommendation={weatherData.rideAnalysis.today}
            title="Today Overall"
          />

          {/* Next Ride Window */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900 tracking-tight">Next Ride Window</h3>
            {weatherData.rideAnalysis.nextRideWindow ? (
              <div className="text-center">
                <div className="text-4xl mb-4">🚴‍♂️</div>
                <p className="font-semibold text-green-600 text-[17px] mb-1">
                  {weatherData.rideAnalysis.nextRideWindow.date}
                </p>
                <p className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
                  {weatherData.rideAnalysis.nextRideWindow.time}
                </p>
                <p className="text-[15px] text-gray-600">
                  {weatherData.rideAnalysis.nextRideWindow.reason}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">🌧️</div>
                <p className="text-[17px] leading-relaxed">No good riding conditions in the next 24 hours</p>
              </div>
            )}
          </div>
        </div>

        {/* Location info */}
        <div className="text-center text-[15px] text-gray-500 mb-8">
          📍 {weatherData.location.name || `${weatherData.location.latitude.toFixed(2)}, ${weatherData.location.longitude.toFixed(2)}`}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 justify-center">
          <button 
            className="bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-200 font-medium text-[15px] flex items-center gap-2"
            onClick={() => window.location.href = '/app/settings'}
          >
            ⚙️ Settings
          </button>
          <button 
            className="bg-white text-gray-900 px-6 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium text-[15px] flex items-center gap-2"
            onClick={() => window.location.href = '/app/forecast'}
          >
            📊 Forecast
          </button>
        </div>
      </div>
    </div>
  );
}