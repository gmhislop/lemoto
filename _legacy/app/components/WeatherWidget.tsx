'use client';

import { useState, useEffect } from 'react';
import { RideRecommendation } from '@/app/lib/rideEngine';

interface WeatherWidgetProps {
  onClick?: () => void;
}

interface WidgetData {
  suitable: boolean;
  temperature: number;
  description: string;
  score: number;
}

export default function WeatherWidget({ onClick }: WeatherWidgetProps) {
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/weather');
      if (response.ok) {
        const weatherData = await response.json();
        setData({
          suitable: weatherData.rideAnalysis.current.suitable,
          temperature: Math.round(weatherData.weather.current.temperature),
          description: weatherData.weather.current.description,
          score: weatherData.rideAnalysis.current.score
        });
      }
    } catch (error) {
      console.error('Widget fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow w-48"
        onClick={onClick}
      >
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="w-16 h-4 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div 
        className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow w-48"
        onClick={onClick}
      >
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-1">⚠️</div>
          <p className="text-sm">Setup needed</p>
        </div>
      </div>
    );
  }

  const getIndicatorIcon = () => {
    if (data.suitable) return '✅';
    if (data.score >= 40) return '⚠️';
    return '❌';
  };

  const getStatusText = () => {
    if (data.suitable) return 'Ride OK';
    return 'Not Recommended';
  };

  const getStatusColor = () => {
    if (data.suitable) return 'text-green-600';
    if (data.score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow w-48"
      onClick={onClick}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">{getIndicatorIcon()}</div>
        <p className={`font-bold text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        <div className="text-xs text-gray-600 mt-2">
          <p>{data.temperature}°C</p>
          <p className="capitalize">{data.description}</p>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Tap for details
        </div>
      </div>
    </div>
  );
}