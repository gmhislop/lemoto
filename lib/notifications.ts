import * as Notifications from 'expo-notifications';
import { TrafficLight } from '../types/ride';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

type ChangeType = 'worsened' | 'improved';

function classifyChange(prev: TrafficLight, next: TrafficLight): ChangeType | null {
  const rank = { green: 2, orange: 1, red: 0 };
  const diff = rank[next] - rank[prev];
  if (diff < 0) return 'worsened';
  if (diff > 0) return 'improved';
  return null;
}

export async function notifyStatusChange(
  rideLabel: string,
  rideDate: string,
  prev: TrafficLight,
  next: TrafficLight,
): Promise<void> {
  const change = classifyChange(prev, next);
  if (!change) return;

  const dateLabel = new Date(rideDate + 'T00:00:00').toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const title = change === 'improved'
    ? `✅ ${rideLabel} — weer opgeklaard`
    : `⚠️ ${rideLabel} — weer verslechterd`;

  const body = change === 'improved'
    ? `Je rit op ${dateLabel} ziet er nu goed uit.`
    : `Slecht weer verwacht voor je rit op ${dateLabel}.`;

  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // immediate
  });
}
