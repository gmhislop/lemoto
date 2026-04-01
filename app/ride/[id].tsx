import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ride } from '../../types/ride';
import { deleteRide, getRides } from '../../lib/ride-storage';
import { WeatherReasons } from '../../components/WeatherReasons';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatDate } from '../../lib/date-utils';

const HERO_LABEL = { green: 'Groen', orange: 'Oranje', red: 'Rood' } as const;
const RECOMMENDATION = {
  green: 'Perfect voor een rit',
  orange: 'Kan, neem regenkleding mee',
  red: 'Niet ideaal, plan liever later',
} as const;
const HERO_BG = { green: colors.greenSoft, orange: colors.orangeSoft, red: colors.redSoft } as const;

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [rawExpanded, setRawExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getRides().then((rides) => setRide(rides.find((r) => r.id === id) ?? null));
    }, [id]),
  );

  async function handleDelete() {
    Alert.alert('Rit verwijderen', 'Weet je zeker dat je deze rit wilt verwijderen?', [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Verwijderen',
        style: 'destructive',
        onPress: async () => {
          await deleteRide(id!);
          router.back();
        },
      },
    ]);
  }

  if (!ride) return null;

  const status = ride.status ?? 'green';

  return (
    <>
      <Stack.Screen options={{ title: ride.label || 'Rit detail' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: HERO_BG[status] }]}>
          <Text style={[styles.heroText, { color: colors[status] }]}>
            {HERO_LABEL[status]}
          </Text>
          <Text style={styles.heroSub}>{RECOMMENDATION[status]}</Text>

          {(ride.confidence === 'medium' || ride.confidence === 'low') && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {ride.confidence === 'low'
                  ? '⚠ Voorspelling kan nog sterk veranderen'
                  : '~ Voorspelling kan nog veranderen'}
              </Text>
            </View>
          )}
        </View>

        {/* Rit info */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Rit</Text>
          <InfoRow label="Datum" value={formatDate(ride.date)} />
          <InfoRow
            label="Tijd"
            value={`${ride.startTime} · ${ride.durationHours}u`}
            mono
          />
          <InfoRow label="Locatie" value={ride.location.label} />
        </View>

        {/* Weerfactoren */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Weerfactoren</Text>
          <WeatherReasons reasons={ride.reasons ?? []} />
        </View>

        {/* Ruwe weerdata — inklapbaar */}
        {ride.weatherData && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.rawToggle}
              onPress={() => setRawExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionLabel}>Weerdata</Text>
              <Text style={styles.chevron}>{rawExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {rawExpanded && (
              <View style={styles.rawRows}>
                <DataRow label="Kans op regen" value={`${ride.weatherData.precipitationProbability}%`} />
                <DataRow label="Neerslag" value={`${ride.weatherData.precipitationMm} mm/u`} />
                <DataRow label="Wind" value={`${ride.weatherData.windSpeedKmh} km/u`} />
                <DataRow label="Windstoten" value={`${ride.weatherData.windGustsKmh} km/u`} />
                <DataRow label="Temperatuur" value={`${ride.weatherData.temperatureC}°C`} />
                <DataRow label="Gevoelstemperatuur" value={`${ride.weatherData.feelsLikeC}°C`} />
              </View>
            )}
          </View>
        )}

        {/* Verwijderen */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
          <Text style={styles.deleteBtnText}>Rit verwijderen</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <Text style={[styles.infoVal, mono && { fontFamily: typography.fontFamily.mono }]}>{value}</Text>
    </View>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['12'] },

  hero: {
    paddingHorizontal: spacing['5'],
    paddingTop: spacing['8'],
    paddingBottom: spacing['8'],
    marginBottom: spacing['3'],
  },
  heroText: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: typography.size.hero,
    lineHeight: typography.size.hero * typography.lineHeight.tight,
    letterSpacing: -1,
  },
  heroSub: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.heroSub,
    color: colors.textSecondary,
    marginTop: spacing['2'],
  },
  confidenceBadge: {
    marginTop: spacing['4'],
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
  },
  confidenceText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },

  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing['4'],
    marginHorizontal: spacing['5'],
    marginBottom: spacing['3'],
    ...shadows.card,
  },
  sectionLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing['3'],
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['2'],
  },
  infoKey: { fontSize: typography.size.sm, color: colors.textMuted },
  infoVal: { fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.medium },

  rawToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevron: { fontSize: typography.size.xs, color: colors.textMuted },
  rawRows: { marginTop: spacing['3'], gap: spacing['2'] },

  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dataLabel: { fontSize: typography.size.sm, color: colors.textMuted },
  dataValue: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },

  deleteBtn: {
    marginHorizontal: spacing['5'],
    marginTop: spacing['2'],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing['3'],
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
});
