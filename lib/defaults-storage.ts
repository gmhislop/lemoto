import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'lemoto:last-location';

export interface SavedLocation {
  label: string;
  lat: number;
  lon: number;
}

export async function getLastLocation(): Promise<SavedLocation | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveLastLocation(loc: SavedLocation): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(loc));
}
