import { createClient } from '@/app/utils/supabase/server';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/app/types/preferences';

export class PreferencesService {
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching preferences:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      schedule: data.schedule,
      weather: data.weather,
      location: data.location,
      notifications: data.notifications,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async createUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    const supabase = await createClient();
    
    const newPreferences = {
      user_id: userId,
      schedule: preferences.schedule || DEFAULT_PREFERENCES.schedule,
      weather: preferences.weather || DEFAULT_PREFERENCES.weather,
      location: preferences.location || DEFAULT_PREFERENCES.location,
      notifications: preferences.notifications ?? DEFAULT_PREFERENCES.notifications
    };
    
    const { data, error } = await supabase
      .from('user_preferences')
      .insert(newPreferences)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating preferences:', error);
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      schedule: data.schedule,
      weather: data.weather,
      location: data.location,
      notifications: data.notifications,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    const supabase = await createClient();
    
    const updates = {
      ...(preferences.schedule && { schedule: preferences.schedule }),
      ...(preferences.weather && { weather: preferences.weather }),
      ...(preferences.location && { location: preferences.location }),
      ...(preferences.notifications !== undefined && { notifications: preferences.notifications }),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating preferences:', error);
      return null;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      schedule: data.schedule,
      weather: data.weather,
      location: data.location,
      notifications: data.notifications,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async getOrCreateUserPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      preferences = await this.createUserPreferences(userId, DEFAULT_PREFERENCES);
      if (!preferences) {
        throw new Error('Failed to create user preferences');
      }
    }
    
    return preferences;
  }
}