import { useCallback, useEffect, useRef, useMemo } from 'react';
import { AppState, AppStateStatus, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride } from '../../types/ride';
import { getRides, updateRide } from '../../lib/ride-storage';
import { generateRecurringInstances } from '../../lib/recurring-engine';
import { notifyStatusChange } from '../../lib/notifications';
import { fetchWeatherForRide, fetchTodayHourly } from '../../lib/weather-api';
import { calculateRideScore, calculateConfidence, findBestRideWindow, summarizeRide, BestWindow } from '../../lib/weather-score';
import { updateWidgetCache } from '../../lib/widget-cache';
import { getLastLocation } from '../../lib/defaults-storage';
import { UserPreferences, DEFAULT_PREFERENCES } from '../../types/weather';
import { useTheme } from '../../context/ThemeContext';

const PREFS_KEY = 'lemoto:preferences';
const STALE_HOURS = 3;

function needsRefresh(ride: Ride): boolean {
  if (!ride.weatherData || !ride.fetchedAt) return true;
  const ageHours = (Date.now() - new Date(ride.fetchedAt).getTime()) / 3_600_000;
  return ageHours > STALE_HOURS;
}
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

function computeEndTime(startTime: string, durationHours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const t = h * 60 + m + durationHours * 60;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
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
  const [refreshing, setRefreshing] = useState(false);
  const [bestWindow, setBestWindow] = useState<BestWindow | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        loadAndRefresh();
        loadBestWindow();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

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
      generateRecurringInstances().then(() => loadAndRefresh());
      loadBestWindow();
    }, []),
  );

  async function loadBestWindow() {
    try {
      const [loc, prefsRaw] = await Promise.all([
        getLastLocation(),
        AsyncStorage.getItem(PREFS_KEY),
      ]);
      if (!loc) return;
      const prefs: UserPreferences = prefsRaw ? JSON.parse(prefsRaw) : DEFAULT_PREFERENCES;
      const hours = await fetchTodayHourly(loc.lat, loc.lon);
      setBestWindow(findBestRideWindow(hours, prefs));
    } catch { /* no window if offline */ }
  }

  async function loadAndRefresh(forceAll = false) {
    const loaded = await getRides();
    setRides(loaded);
    const stale = loaded.filter((r) => forceAll || needsRefresh(r));
    if (!stale.length) { setRefreshing(false); return; }
    setRefreshing(true);
    try {
      const prefsRaw = await AsyncStorage.getItem(PREFS_KEY);
      const prefs: UserPreferences = prefsRaw ? JSON.parse(prefsRaw) : DEFAULT_PREFERENCES;
      await Promise.allSettled(
        stale.map(async (ride) => {
          try {
            const endTime = computeEndTime(ride.startTime, ride.durationHours);
            const [outboundWeather, returnWeather] = await Promise.all([
              fetchWeatherForRide(ride.location.lat, ride.location.lon, ride.date, ride.startTime, 1),
              fetchWeatherForRide(ride.location.lat, ride.location.lon, ride.date, endTime, 1),
            ]);
            const { overallStatus, outboundStatus, returnStatus, reasons, advisory, advisoryType } = calculateRideScore(outboundWeather, returnWeather, prefs);
            const confidence = calculateConfidence(ride.date);
            const updates = {
              weatherData: outboundWeather,
              returnWeatherData: returnWeather,
              status: overallStatus,
              outboundStatus,
              returnStatus,
              reasons,
              advisory,
              advisoryType,
              confidence,
              fetchedAt: new Date().toISOString(),
            };
            if (ride.status && ride.status !== overallStatus) {
              notifyStatusChange(ride.label, ride.date, ride.status, overallStatus).catch(() => {});
            }
            await updateRide(ride.id, updates);
            setRides((prev) => prev.map((r) => r.id === ride.id ? { ...r, ...updates } : r));
          } catch { /* individual ride failure — skip silently */ }
        }),
      );
    } finally {
      setRefreshing(false);
      // Write widget-ready snapshot after refresh completes
      const allRides = await getRides();
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowStr = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
      const nextRide = allRides.find((r) => r.date >= todayStr);
      const overallForWidget = getOverallStatus(allRides.filter((r) => r.date >= todayStr));
      const summaryForWidget = nextRide?.reasons
        ? summarizeRide(overallForWidget, nextRide.reasons, {
            returnTime: nextRide ? computeEndTime(nextRide.startTime, nextRide.durationHours) : undefined,
            confidence: nextRide?.confidence,
          })
        : overallForWidget === 'green' ? 'Perfect conditions' : 'Check conditions';
      updateWidgetCache({
        status: overallForWidget,
        summary: summaryForWidget,
        bestWindow: null, // updated separately in loadBestWindow
        nextRideDate: nextRide?.date ?? null,
        nextRideTime: nextRide?.startTime ?? null,
        nextRideLabel: nextRide?.label ?? null,
        advisory: nextRide?.advisory,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = rides.filter((r) => new Date(r.date + 'T00:00:00') >= today);
  const pastCount = rides.length - upcoming.length;

  const overallStatus = getOverallStatus(upcoming);
  const weatherData = upcoming[0]?.weatherData;
  const heroSummary = upcoming[0]?.reasons
    ? summarizeRide(overallStatus, upcoming[0].reasons, {
        returnTime: computeEndTime(upcoming[0].startTime, upcoming[0].durationHours),
        confidence: upcoming[0].confidence,
      })
    : overallStatus === 'green' ? 'Perfect conditions' : 'Check conditions';

  return (
    <View style={s.screen}>
      <AppHeader />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => loadAndRefresh(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero */}
        <FadeInView>
          <View style={s.hero}>
            <Text style={s.heroLabel}>CURRENT STATUS</Text>
            <Animated.Text style={[s.heroTitle, titleStyle]}>
              {STATUS_HEADLINE[overallStatus]}
            </Animated.Text>
            <Text style={s.heroSummary}>{heroSummary.toUpperCase()}</Text>
            <Text style={s.heroDate}>{getTodayLabel()}</Text>
            <View style={s.statsRow}>
              <StatChip label="TEMP"   value={weatherData ? `${weatherData.temperatureC}°C` : '—'} colors={colors} />
              <StatChip label="PRECIP" value={weatherData ? `${weatherData.precipitationProbability}%` : '—'} colors={colors} />
              <StatChip label="WIND"   value={weatherData ? `${weatherData.windSpeedKmh} KM/H` : '—'} colors={colors} />
              {refreshing && (
                <View style={s.updatingChip}>
                  <Feather name="refresh-cw" size={10} color={colors.outline} />
                  <Text style={s.updatingText}>UPDATING</Text>
                </View>
              )}
            </View>
            {bestWindow && (
              <View style={[s.bestWindowRow, { borderColor: bestWindow.status === 'green' ? colors.lime : colors.orange }]}>
                <Feather name="sun" size={12} color={bestWindow.status === 'green' ? colors.primary : colors.orange} />
                <Text style={s.bestWindowLabel}>BEST WINDOW</Text>
                <Text style={[s.bestWindowValue, { color: bestWindow.status === 'green' ? colors.primary : colors.orange }]}>
                  {bestWindow.start} – {bestWindow.end}
                </Text>
              </View>
            )}
          </View>
        </FadeInView>

        {/* Rides */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>PLANNED RIDES</Text>
            {pastCount > 0 && (
              <Text style={s.pastCount}>{pastCount} PAST</Text>
            )}
          </View>
          {upcoming.length === 0 ? (
            <FadeInView delay={100}>
              <View style={s.empty}>
                <Feather name="calendar" size={32} color={colors.outline} style={{ marginBottom: 12 }} />
                <Text style={s.emptyText}>{rides.length > 0 ? 'ALL RIDES COMPLETE.' : 'NO RIDES PLANNED.'}</Text>
                <Text style={s.emptyHint}>{rides.length > 0 ? 'Add a new ride to get started.' : 'Add your first ride below.'}</Text>
              </View>
            </FadeInView>
          ) : (
            upcoming.map((ride, index) => (
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
  const summary = ride.reasons
    ? summarizeRide(status, ride.reasons, {
        returnTime: getEndTime(ride.startTime, ride.durationHours),
        confidence: ride.confidence,
      })
    : null;

  return (
    <PressableScale style={rStyles.row} onPress={onPress} haptic>
      <View style={[rStyles.accent, { backgroundColor: accent }]} />
      <View style={rStyles.left}>
        <Text style={rStyles.time}>{ride.startTime} — {getEndTime(ride.startTime, ride.durationHours)}</Text>
        <Text style={rStyles.period}>{getTimePeriod(ride.startTime)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={rStyles.name} numberOfLines={1}>{(ride.label || 'UNNAMED RIDE').toUpperCase()}</Text>
          {ride.recurringId && <Feather name="repeat" size={11} color={c.outline} />}
        </View>
        {summary && <Text style={[rStyles.summary, { color: accent }]} numberOfLines={1}>{summary}</Text>}
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
    summary: { fontFamily: typography.fontFamily.body, fontSize: typography.size.xs, letterSpacing: 0.3 },
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
  heroTitle: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.display, color: c.onSurface, letterSpacing: -2, lineHeight: typography.size.display * typography.lineHeight.tight, marginBottom: 4 },
  heroSummary: { fontFamily: typography.fontFamily.body, fontSize: typography.size.sm, color: c.onSurfaceVariant, letterSpacing: 1, marginBottom: 16 },
  heroDate: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.sm, color: c.outline, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  bestWindowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderWidth: 1, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  bestWindowLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1 },
  bestWindowValue: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, letterSpacing: 0.5 },
  updatingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  updatingText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1 },
  section: { paddingHorizontal: 24, paddingTop: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  sectionTitle: { fontFamily: typography.fontFamily.headline, fontSize: 20, color: c.onSurface, letterSpacing: -0.3 },
  pastCount: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1 },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurfaceVariant },
  emptyHint: { fontFamily: typography.fontFamily.body, fontSize: typography.size.base, color: c.outline, marginTop: 4 },
});
