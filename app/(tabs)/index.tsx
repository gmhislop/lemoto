import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { Ride } from '../../types/ride';
import { getRides } from '../../lib/ride-storage';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../theme/colors';
import { AppHeader } from '../../components/AppHeader';
import { PressableScale } from '../../components/PressableScale';
import { FadeInView } from '../../components/FadeInView';
import { PulsingDot } from '../../components/PulsingDot';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatDate } from '../../lib/date-utils';

const STATUS_HEADLINE = { green: 'ALL CLEAR.', orange: 'CAUTION.', red: 'STAY HOME.' } as const;

function getTimePeriod(time: string): string {
  const h = parseInt(time.split(':')[0], 10);
  if (h >= 5 && h < 12) return 'MORNING';
  if (h >= 12 && h < 17) return 'AFTERNOON';
  if (h >= 17 && h < 22) return 'EVENING';
  return 'NIGHT';
}

function getOverallStatus(rides: Ride[]): 'green' | 'orange' | 'red' {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 2);
  const upcoming = rides.filter((r) => {
    const d = new Date(r.date + 'T00:00:00');
    return d >= today && d < tomorrow && r.status;
  });
  if (upcoming.some((r) => r.status === 'red')) return 'red';
  if (upcoming.some((r) => r.status === 'orange')) return 'orange';
  return 'green';
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).toUpperCase();
}

function getEndTime(startTime: string, durationHours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + durationHours * 60;
  return `${String(Math.floor(totalMin / 60) % 24).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [rides, setRides] = useState<Ride[]>([]);

  const titleY = useSharedValue(24);
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.94);
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }, { scale: titleScale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      titleY.value = 24; titleOpacity.value = 0; titleScale.value = 0.94;
      titleOpacity.value = withDelay(60, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }));
      titleY.value = withDelay(60, withSpring(0, { damping: 18, stiffness: 160, mass: 0.7 }));
      titleScale.value = withDelay(60, withSpring(1, { damping: 18, stiffness: 160, mass: 0.7 }));
      getRides().then(setRides);
    }, []),
  );

  const overallStatus = getOverallStatus(rides);
  const weatherData = rides[0]?.weatherData;

  return (
    <View style={s.screen}>
      <AppHeader />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <FadeInView>
          <View style={s.hero}>
            <Text style={s.heroLabel}>CURRENT STATUS</Text>
            <Animated.Text style={[s.heroTitle, titleStyle]}>
              {STATUS_HEADLINE[overallStatus]}
            </Animated.Text>
            <Text style={s.heroDate}>{getTodayLabel()}</Text>
            <View style={s.statsRow}>
              <StatChip label="TEMP"   value={weatherData ? `${weatherData.temperatureC}°C` : '—'} colors={colors} />
              <StatChip label="PRECIP" value={weatherData ? `${weatherData.precipitationProbability}%` : '—'} colors={colors} />
              <StatChip label="WIND"   value={weatherData ? `${weatherData.windSpeedKmh} KM/H` : '—'} colors={colors} />
            </View>
          </View>
        </FadeInView>

        {/* Rides */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>PLANNED RIDES</Text>
          </View>
          {rides.length === 0 ? (
            <FadeInView delay={100}>
              <View style={s.empty}>
                <Text style={s.emptyText}>NO RIDES PLANNED</Text>
                <Text style={s.emptyHint}>Add your first ride below.</Text>
              </View>
            </FadeInView>
          ) : (
            rides.map((ride, index) => (
              <FadeInView key={ride.id} delay={index * 60}>
                <RideRow ride={ride} onPress={() => router.push(`/ride/${ride.id}`)} colors={colors} />
              </FadeInView>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatChip({ label, value, colors: c }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={chipStyle(c).chip}>
      <Text style={chipStyle(c).label}>{label}</Text>
      <Text style={chipStyle(c).value}>{value}</Text>
    </View>
  );
}

function chipStyle(c: Colors) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: 14, paddingVertical: 10,
      backgroundColor: c.surfaceCard,
      borderWidth: 1, borderColor: c.outlineAlpha20,
      borderRadius: 4, gap: 2,
    },
    label: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1 },
    value: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface },
  });
}

function RideRow({ ride, onPress, colors: c }: { ride: Ride; onPress: () => void; colors: Colors }) {
  const status = ride.status ?? 'green';
  const accent = { green: c.green, orange: c.orange, red: c.red }[status];
  const rStyles = rowStyle(c);

  return (
    <PressableScale style={rStyles.row} onPress={onPress} haptic>
      <View style={[rStyles.accent, { backgroundColor: accent }]} />
      <View style={rStyles.left}>
        <Text style={rStyles.time}>{ride.startTime} — {getEndTime(ride.startTime, ride.durationHours)}</Text>
        <Text style={rStyles.period}>{getTimePeriod(ride.startTime)}</Text>
        <Text style={rStyles.name} numberOfLines={1}>{(ride.label || 'UNNAMED RIDE').toUpperCase()}</Text>
        <Text style={rStyles.location} numberOfLines={1}>{ride.location.label}</Text>
      </View>
      <View style={rStyles.right}>
        <Text style={rStyles.statusLabel}>STATUS</Text>
        <PulsingDot color={accent} size={14} pulse={status === 'green'} />
        <Feather name="chevron-right" size={16} color={c.outline} style={{ marginTop: 8 }} />
      </View>
    </PressableScale>
  );
}

function rowStyle(c: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'stretch',
      backgroundColor: c.surfaceLow, borderRadius: 4, marginBottom: spacing['3'], overflow: 'hidden',
    },
    accent: { width: 4 },
    left: { flex: 1, paddingVertical: 16, paddingHorizontal: 16, gap: 2 },
    right: { paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 4 },
    time: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.md, color: c.onSurface },
    period: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1, marginBottom: 6 },
    name: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface, letterSpacing: -0.3 },
    location: { fontFamily: typography.fontFamily.body, fontSize: typography.size.base, color: c.outline },
    statusLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1 },
  });
}

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  hero: { backgroundColor: c.surfaceCard, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28, marginBottom: 4 },
  heroLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 3, marginBottom: 10 },
  heroTitle: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.display, color: c.onSurface, letterSpacing: -2, lineHeight: typography.size.display * typography.lineHeight.tight, marginBottom: 8 },
  heroDate: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.sm, color: c.outline, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  section: { paddingHorizontal: 24, paddingTop: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  sectionTitle: { fontFamily: typography.fontFamily.headline, fontSize: 20, color: c.onSurface, letterSpacing: -0.3 },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurfaceVariant },
  emptyHint: { fontFamily: typography.fontFamily.body, fontSize: typography.size.base, color: c.outline, marginTop: 4 },
});
