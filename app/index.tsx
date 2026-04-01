import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ride } from '../types/ride';
import { getRides } from '../lib/ride-storage';
import { getTonightDefaults, getWeekendDefaults } from '../lib/date-utils';
import { RideCard } from '../components/RideCard';
import { QuickAdd } from '../components/QuickAdd';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function HomeScreen() {
  const [rides, setRides] = useState<Ride[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRides().then(setRides);
    }, []),
  );

  function handleQuickAdd(type: 'tonight' | 'weekend') {
    const d = type === 'tonight' ? getTonightDefaults() : getWeekendDefaults();
    router.push({
      pathname: '/add-ride',
      params: { date: d.date, startTime: d.startTime, durationHours: String(d.durationHours) },
    });
  }

  return (
    <View style={styles.screen}>
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<QuickAdd onSelect={handleQuickAdd} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nog geen ritten gepland.</Text>
              <Text style={styles.emptyHint}>Voeg je eerste rit toe.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing['3'] }} />}
          renderItem={({ item }) => (
            <RideCard ride={item} onPress={() => router.push(`/ride/${item.id}`)} />
          )}
        />
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add-ride')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+ Rit toevoegen</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing['5'],
    paddingBottom: 120,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing['12'],
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: spacing['1'],
  },
  fab: {
    position: 'absolute',
    bottom: 48, // boven home indicator op iPhone X+
    right: spacing['5'],
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    paddingHorizontal: spacing['6'],
    paddingVertical: spacing['3'],
  },
  fabText: {
    color: colors.white,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
