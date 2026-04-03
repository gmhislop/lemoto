import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { TrafficLight } from '../types/ride';
import { BestWindow } from './weather-score';

export interface WidgetData {
  status: TrafficLight;        // overall verdict for today/tomorrow
  summary: string;             // e.g. "Dry and calm" / "Rain on return"
  bestWindow: BestWindow | null;
  nextRideDate: string | null; // ISO date of next planned ride
  nextRideTime: string | null; // "18:00"
  nextRideLabel: string | null;
  advisory?: string;           // e.g. "Return conditions are dangerous"
  updatedAt: string;           // ISO timestamp
}

const APP_GROUP  = 'group.com.lemoto.app';
const SHARED_KEY = 'lemoto_widget';  // UserDefaults key — no colons
const LOCAL_KEY  = 'lemoto:widget';  // AsyncStorage key for in-app reads

export async function updateWidgetCache(data: WidgetData): Promise<void> {
  try {
    // Write to shared UserDefaults so the iOS widget extension can read it
    await SharedGroupPreferences.setItem(SHARED_KEY, data, APP_GROUP);
    // Keep AsyncStorage in sync for in-app reads
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch { /* never block the caller */ }
}

export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as WidgetData) : null;
  } catch {
    return null;
  }
}
