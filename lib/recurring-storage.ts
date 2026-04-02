import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecurringRide } from '../types/recurring';

const KEY = 'lemoto:recurring';

export async function getRecurringRides(): Promise<RecurringRide[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRecurringRide(ride: RecurringRide): Promise<void> {
  const rides = await getRecurringRides();
  rides.push(ride);
  await AsyncStorage.setItem(KEY, JSON.stringify(rides));
}

export async function updateRecurringRide(id: string, updates: Partial<RecurringRide>): Promise<void> {
  const rides = await getRecurringRides();
  const idx = rides.findIndex((r) => r.id === id);
  if (idx === -1) return;
  rides[idx] = { ...rides[idx], ...updates };
  await AsyncStorage.setItem(KEY, JSON.stringify(rides));
}

export async function deleteRecurringRide(id: string): Promise<void> {
  const rides = await getRecurringRides();
  await AsyncStorage.setItem(KEY, JSON.stringify(rides.filter((r) => r.id !== id)));
}
