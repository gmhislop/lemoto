import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { weatherService } from '@/app/lib/weather';
import { PreferencesService } from '@/app/lib/preferences';
import { RideEngine } from '@/app/lib/rideEngine';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user preferences
    const preferences = await PreferencesService.getOrCreateUserPreferences(user.id);
    
    if (!preferences.location.latitude || !preferences.location.longitude) {
      return NextResponse.json({ 
        error: 'Location not set. Please configure your location in preferences.' 
      }, { status: 400 });
    }

    // Fetch weather data
    const weatherForecast = await weatherService.getForecast(
      preferences.location.latitude,
      preferences.location.longitude
    );

    // Analyze ride conditions
    const rideAnalysis = await RideEngine.analyzeRideConditions(weatherForecast, preferences);

    return NextResponse.json({
      weather: weatherForecast,
      rideAnalysis,
      location: preferences.location
    });

  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}