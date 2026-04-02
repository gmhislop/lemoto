import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrafficLight } from '../types/ride';
import { BestWindow } from './weather-score';

export interface WidgetData {
  status: TrafficLight;        // overall verdict for today/tomorrow
  summary: string;             // e.g. "Dry and calm" / "Rain on return"
  bestWindow: BestWindow | null;
  nextRideDate: string | null; // ISO date of next planned ride
  nextRideTime: string | null; // "18:00"
  nextRideLabel: string | null;
  updatedAt: string;           // ISO timestamp
}

const WIDGET_KEY = 'lemoto:widget';

export async function updateWidgetCache(data: WidgetData): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify(data));
  } catch { /* never block the caller */ }
}

export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_KEY);
    return raw ? (JSON.parse(raw) as WidgetData) : null;
  } catch {
    return null;
  }
}
