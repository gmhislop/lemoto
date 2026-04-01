import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeekSchedule, DEFAULT_SCHEDULE } from '../types/schedule';

const KEY = 'lemoto:schedule';

export async function getSchedule(): Promise<WeekSchedule> {
  const json = await AsyncStorage.getItem(KEY);
  return json ? JSON.parse(json) : DEFAULT_SCHEDULE;
}

export async function saveSchedule(schedule: WeekSchedule): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(schedule));
}
