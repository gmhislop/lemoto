import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride } from '../types/ride';

const RIDES_KEY = 'lemoto:rides';

export async function getRides(): Promise<Ride[]> {
  const json = await AsyncStorage.getItem(RIDES_KEY);
  if (!json) return [];
  const rides = JSON.parse(json) as Ride[];
  return rides.sort((a, b) => {
    const aKey = `${a.date}T${a.startTime}`;
    const bKey = `${b.date}T${b.startTime}`;
    return aKey.localeCompare(bKey);
  });
}

export async function saveRide(ride: Ride): Promise<void> {
  const json = await AsyncStorage.getItem(RIDES_KEY);
  const rides: Ride[] = json ? JSON.parse(json) : [];
  rides.push(ride);
  await AsyncStorage.setItem(RIDES_KEY, JSON.stringify(rides));
}

export async function updateRide(id: string, updates: Partial<Ride>): Promise<void> {
  const rides = await getRides();
  const idx = rides.findIndex((r) => r.id === id);
  if (idx === -1) return;
  rides[idx] = { ...rides[idx], ...updates };
  await AsyncStorage.setItem(RIDES_KEY, JSON.stringify(rides));
}

export async function deleteRide(id: string): Promise<void> {
  const rides = await getRides();
  const filtered = rides.filter((r) => r.id !== id);
  await AsyncStorage.setItem(RIDES_KEY, JSON.stringify(filtered));
}
