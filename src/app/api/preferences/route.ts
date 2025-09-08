import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { PreferencesService } from '@/app/lib/preferences';
import { UserPreferences } from '@/app/types/preferences';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await PreferencesService.getOrCreateUserPreferences(user.id);
    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UserPreferences = await request.json();
    
    // Validate required fields
    if (!body.location?.latitude || !body.location?.longitude) {
      return NextResponse.json(
        { error: 'Location coordinates are required' },
        { status: 400 }
      );
    }

    if (!body.schedule?.startTime || !body.schedule?.endTime) {
      return NextResponse.json(
        { error: 'Schedule start and end times are required' },
        { status: 400 }
      );
    }

    const preferences = await PreferencesService.updateUserPreferences(user.id, body);
    
    if (!preferences) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(preferences);

  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}