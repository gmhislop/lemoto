'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/app/types/preferences';

interface SettingsFormProps {
  user: User;
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES as UserPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = (key: keyof typeof preferences.schedule, value: any) => {
    setPreferences(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [key]: value }
    }));
  };

  const updateWeather = (key: keyof typeof preferences.weather, value: any) => {
    setPreferences(prev => ({
      ...prev,
      weather: { ...prev.weather, [key]: value }
    }));
  };

  const updateLocation = (key: keyof typeof preferences.location, value: any) => {
    setPreferences(prev => ({
      ...prev,
      location: { ...prev.location, [key]: value }
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocation('latitude', position.coords.latitude);
          updateLocation('longitude', position.coords.longitude);
          setMessage({ type: 'success', text: 'Location updated!' });
        },
        (error) => {
          setMessage({ type: 'error', text: 'Failed to get location' });
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation is not supported' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="text-blue-500 hover:text-blue-600"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Location Settings */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">📍 Location</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={preferences.location.latitude}
                    onChange={(e) => updateLocation('latitude', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={preferences.location.longitude}
                    onChange={(e) => updateLocation('longitude', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <button
                onClick={getCurrentLocation}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                📍 Use Current Location
              </button>
            </div>
          </div>

          {/* Riding Schedule */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">🗓️ Riding Schedule</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.schedule.weekdays}
                    onChange={(e) => updateSchedule('weekdays', e.target.checked)}
                    className="mr-2"
                  />
                  Weekdays (Mon-Fri)
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.schedule.weekends}
                    onChange={(e) => updateSchedule('weekends', e.target.checked)}
                    className="mr-2"
                  />
                  Weekends (Sat-Sun)
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={preferences.schedule.startTime}
                    onChange={(e) => updateSchedule('startTime', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={preferences.schedule.endTime}
                    onChange={(e) => updateSchedule('endTime', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weather Preferences */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">🌡️ Weather Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Minimum Temperature ({preferences.weather.minTemperature}°C)
                </label>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={preferences.weather.minTemperature}
                  onChange={(e) => updateWeather('minTemperature', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>-10°C</span>
                  <span>30°C</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Wind Speed ({preferences.weather.maxWindSpeed} m/s)
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={preferences.weather.maxWindSpeed}
                  onChange={(e) => updateWeather('maxWindSpeed', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 m/s</span>
                  <span>30 m/s</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.weather.allowRain}
                    onChange={(e) => updateWeather('allowRain', e.target.checked)}
                    className="mr-2"
                  />
                  Allow riding in rain
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.weather.avoidStorm}
                    onChange={(e) => updateWeather('avoidStorm', e.target.checked)}
                    className="mr-2"
                  />
                  Avoid storms/thunderstorms
                </label>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">🔔 Notifications</h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="mr-2"
              />
              Enable push notifications for weather changes
            </label>
          </div>

          {/* Save Button */}
          <div className="text-center">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}