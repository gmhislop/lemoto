import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

function getModule() {
  if (Platform.OS !== 'ios') return null;
  try {
    return requireNativeModule('LemotoWidgetKit');
  } catch {
    return null; // Expo Go / tests
  }
}

/** Write widget data JSON to shared UserDefaults and immediately reload WidgetKit timelines. */
export async function writeWidgetData(json: string): Promise<void> {
  const mod = getModule();
  if (!mod) return;
  try {
    await mod.writeWidgetData(json);
  } catch { /* never block the caller */ }
}
