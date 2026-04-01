import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFonts, DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SEED_RIDES } from '../lib/seed-data';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

async function seedIfEmpty() {
  const existing = await AsyncStorage.getItem('lemoto:rides');
  if (!existing || JSON.parse(existing).length === 0) {
    await AsyncStorage.setItem('lemoto:rides', JSON.stringify(SEED_RIDES));
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ DMMono_400Regular, DMMono_500Medium });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      seedIfEmpty().finally(() => setReady(true));
    }
  }, [fontsLoaded, fontError]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerBackTitle: 'Terug',
          contentStyle: { backgroundColor: '#EBEBEB' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Lemoto',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                style={{ marginRight: spacing['2'] }}
              >
                <Feather name="settings" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="add-ride" options={{ title: 'Rit toevoegen', presentation: 'modal' }} />
        <Stack.Screen name="ride/[id]" options={{ title: 'Rit detail' }} />
        <Stack.Screen name="settings" options={{ title: 'Instellingen' }} />
        <Stack.Screen name="week-schedule" options={{ title: 'Weekschema', presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
