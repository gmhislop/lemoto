import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrafficLight } from '../types/ride';
import { BestWindow } from './weather-score';
import { writeWidgetData } from './widget-kit';

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

const LOCAL_KEY = 'lemoto:widget';  // AsyncStorage key for in-app reads

export async function updateWidgetCache(data: WidgetData): Promise<void> {
  try {
    const json = JSON.stringify(data);
    // Write to shared UserDefaults + reload WidgetKit timelines in one native call
    await writeWidgetData(json);
    // Keep AsyncStorage in sync for in-app reads
    await AsyncStorage.setItem(LOCAL_KEY, json);
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
