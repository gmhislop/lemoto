import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride } from '../../types/ride';
import { deleteRide, getRides, updateRide } from '../../lib/ride-storage';
import { fetchWeatherForRide } from '../../lib/weather-api';
import { calculateRideScore, calculateConfidence, summarizeRide } from '../../lib/weather-score';
import { UserPreferences, DEFAULT_PREFERENCES } from '../../types/weather';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../theme/colors';
import { FadeInView } from '../../components/FadeInView';
import { PressableScale } from '../../components/PressableScale';
import { typography } from '../../theme/typography';
import { formatDate } from '../../lib/date-utils';

const PREFS_KEY = 'lemoto:preferences';

const STATUS_HEADLINE = {
  green:  'ALL CLEAR.',
  orange: 'PROCEED WITH CAUTION.',
  red:    'ABORT MISSION.',
} as const;
const STATUS_SUB = {
  green:  'OPTIMAL CONDITIONS. GOOD TO GO.',
  orange: 'CONDITIONS ACCEPTABLE. STAY ALERT.',
  red:    'HIGH RISK CONDITIONS. PLAN ANOTHER DAY.',
} as const;
const STATUS_ICON = {
  green: 'check-circle' as const,
  orange: 'alert-triangle' as const,
  red: 'x-circle' as const,
};

function getEndTime(startTime: string, durationHours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const t = h * 60 + m + durationHours * 60;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

// Animated progress bar that fills on mount
function AnimatedBar({ targetPercent, color }: { targetPercent: number; color: string }) {
  const width = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({ width: (width.value + '%') as any }));
  useEffect(() => {
    width.value = withDelay(300, withTiming(Math.min(Math.max(targetPercent, 0), 100), {
      duration: 900, easing: Easing.out(Easing.cubic),
    }));
  }, []);
  return (
    <View style={barStatic.track}>
      <Animated.View style={[barStatic.fill, { backgroundColor: color }, barStyle]} />
    </View>
  );
}
const barStatic = StyleSheet.create({
  track: { flex: 1, height: 4, backgroundColor: 'rgba(128,128,128,0.18)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [ride, setRide] = useState<Ride | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshRotation = useSharedValue(0);
  const refreshIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: (refreshRotation.value + 'deg') as any }],
  }));

  const heroScale = useSharedValue(0.85);
  const heroOpacity = useSharedValue(0);
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      getRides().then((rides) => {
        const found = rides.find((r) => r.id === id) ?? null;
        setRide(found);
        if (found) {
          heroOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
          heroScale.value = withSpring(1, { damping: 16, stiffness: 140, mass: 0.8 });
        }
      });
    }, [id]),
  );

  async function handleRefreshWeather() {
    if (!ride || refreshing) return;
    setRefreshing(true);
    refreshRotation.value = withRepeat(
      withSequence(
        withTiming(360, { duration: 800, easing: Easing.linear }),
      ),
      -1,
    );
    try {
      const endTime = getEndTime(ride.startTime, ride.durationHours);
      const [outboundWeather, returnWeather, prefsRaw] = await Promise.all([
        fetchWeatherForRide(ride.location.lat, ride.location.lon, ride.date, ride.startTime, 1),
        fetchWeatherForRide(ride.location.lat, ride.location.lon, ride.date, endTime, 1),
        AsyncStorage.getItem(PREFS_KEY),
      ]);
      const prefs: UserPreferences = prefsRaw ? JSON.parse(prefsRaw) : DEFAULT_PREFERENCES;
      const { overallStatus, outboundStatus, returnStatus, reasons } = calculateRideScore(outboundWeather, returnWeather, prefs);
      const confidence = calculateConfidence(ride.date);
      const updates = {
        weatherData: outboundWeather,
        returnWeatherData: returnWeather,
        status: overallStatus,
        outboundStatus,
        returnStatus,
        reasons,
        confidence,
        fetchedAt: new Date().toISOString(),
      };
      await updateRide(ride.id, updates);
      setRide((prev) => prev ? { ...prev, ...updates } : prev);
      heroOpacity.value = 0;
      heroScale.value = 0.85;
      heroOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
      heroScale.value = withSpring(1, { damping: 16, stiffness: 140, mass: 0.8 });
    } catch {
      Alert.alert('Refresh failed', 'Could not fetch weather data. Check your connection.');
    } finally {
      refreshRotation.value = 0;
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete ride', 'Remove this ride?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRide(id!); router.back(); } },
    ]);
  }

  if (!ride) return null;

  const status = ride.status ?? 'green';
  const accent = { green: colors.green, orange: colors.orange, red: colors.red }[status];
  const wd = ride.weatherData;
  const criticalReason = ride.reasons?.find((r) => r.severity === 'danger') ?? ride.reasons?.find((r) => r.severity === 'warning') ?? null;
  const rideSummary = ride.reasons
    ? summarizeRide(status, ride.reasons, {
        returnTime: getEndTime(ride.startTime, ride.durationHours),
        confidence: ride.confidence,
      })
    : STATUS_SUB[status];

  return (
    <>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>LEMOTO</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={s.screen}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero circle */}
        <Animated.View style={[s.heroSection, heroStyle]}>
          <View style={s.heroOuter}>
            <View style={s.heroMiddle}>
              <View style={[s.heroInner, { backgroundColor: accent, shadowColor: accent }]}>
                <Feather name={STATUS_ICON[status]} size={44} color={status === 'green' ? colors.limeText : '#FFFFFF'} />
              </View>
            </View>
          </View>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>{ride.confidence ? ride.confidence.toUpperCase() : 'HIGH'} CONF.</Text>
          </View>
          <Text style={s.heroTitle}>{STATUS_HEADLINE[status]}</Text>
          <Text style={s.heroSub}>{rideSummary.toUpperCase()}</Text>
        </Animated.View>

        {/* Critical factor */}
        {wd && (
          <FadeInView delay={80}>
            <View style={s.criticalCard}>
              <View style={[s.cardAccent, { backgroundColor: accent }]} />
              <View style={s.criticalContent}>
                <View style={s.criticalHeader}>
                  <Text style={s.cardLabel}>CRITICAL FACTOR</Text>
                  <Feather
                    name={criticalReason?.factor === 'rain' ? 'cloud-rain' : criticalReason?.factor === 'temperature' ? 'thermometer' : 'wind'}
                    size={18} color={colors.onSurfaceVariant}
                  />
                </View>
                <View style={s.criticalStat}>
                  <Text style={s.criticalNumber}>
                    {criticalReason?.factor === 'wind' ? Math.max(wd.windSpeedKmh, wd.windGustsKmh)
                      : criticalReason?.factor === 'rain' ? wd.precipitationProbability
                      : wd.feelsLikeC}
                  </Text>
                  <Text style={s.criticalUnit}>
                    {criticalReason?.factor === 'wind' ? 'KM/H' : criticalReason?.factor === 'rain' ? '%' : '°C'}
                  </Text>
                </View>
                <View style={s.progressRow}>
                  <AnimatedBar
                    targetPercent={Math.min(
                      criticalReason?.factor === 'wind' ? (Math.max(wd.windSpeedKmh, wd.windGustsKmh) / 80) * 100
                        : criticalReason?.factor === 'rain' ? wd.precipitationProbability
                        : Math.max(0, (1 - wd.feelsLikeC / 20) * 100),
                      100,
                    )}
                    color={accent}
                  />
                  <Text style={[s.progressLabel, { color: accent }]}>{criticalReason?.factor?.toUpperCase() ?? 'WIND'}</Text>
                </View>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Stats grid */}
        {wd && (
          <FadeInView delay={140}>
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <View style={[s.cardAccent, { backgroundColor: wd.precipitationProbability < 30 ? colors.lime : colors.orange }]} />
                <View style={s.statContent}>
                  <Text style={s.cardLabel}>PRECIPITATION</Text>
                  <View style={s.statValueRow}>
                    <Text style={s.statNumber}>{wd.precipitationProbability}</Text>
                    <Text style={s.statUnit}>%</Text>
                  </View>
                </View>
                <Feather name="cloud-rain" size={32} color={colors.surfaceHighest} style={s.statBg} />
              </View>
              <View style={s.statCard}>
                <View style={[s.cardAccent, { backgroundColor: wd.temperatureC >= 10 ? colors.lime : colors.orange }]} />
                <View style={s.statContent}>
                  <Text style={s.cardLabel}>ATMOSPHERE</Text>
                  <View style={s.statValueRow}>
                    <Text style={s.statNumber}>{wd.temperatureC}</Text>
                    <Text style={s.statUnit}>°C</Text>
                  </View>
                </View>
                <Feather name="thermometer" size={32} color={colors.surfaceHighest} style={s.statBg} />
              </View>
            </View>
          </FadeInView>
        )}

        {/* Ride conditions */}
        <FadeInView delay={200}>
          <View style={s.conditionsCard}>
            <View style={s.conditionsHeader}>
              <View style={[s.conditionsAccent, { backgroundColor: colors.primary }]} />
              <Text style={s.conditionsTitle}>RIDE CONDITIONS</Text>
            </View>
            <View style={s.conditionsBody}>
              <InfoRow label="DATE" value={formatDate(ride.date).toUpperCase()} colors={colors} />
              <InfoRow label="DEPARTURE" value={`${ride.startTime} — ${getEndTime(ride.startTime, ride.durationHours)}`} colors={colors} />
              <InfoRow label="LOCATION" value={ride.location.label.toUpperCase()} colors={colors} />
              {wd && <InfoRow label="WIND" value={`${Math.max(wd.windSpeedKmh, wd.windGustsKmh)} KM/H`} colors={colors} />}
              {(ride.outboundStatus || ride.returnStatus) && (
                <>
                  <View style={s.conditionsDivider} />
                  <LegRow label="OUTBOUND" status={ride.outboundStatus ?? 'green'} colors={colors} />
                  <LegRow label="RETURN" status={ride.returnStatus ?? 'green'} colors={colors} />
                </>
              )}

              {ride.reasons && ride.reasons.length > 0 && (
                <>
                  <View style={s.conditionsDivider} />
                  {ride.reasons.map((reason, i) => (
                    <View key={i} style={s.reasonRow}>
                      <Feather
                        name={reason.factor === 'rain' ? 'cloud-rain' : reason.factor === 'wind' ? 'wind' : 'thermometer'}
                        size={14}
                        color={reason.severity === 'danger' ? colors.red : reason.severity === 'warning' ? colors.orange : colors.primary}
                      />
                      <Text style={s.reasonText}>{reason.label}</Text>
                    </View>
                  ))}
                </>
              )}

              {ride.recurringId && (
                <>
                  <View style={s.conditionsDivider} />
                  <View style={s.reasonRow}>
                    <Feather name="repeat" size={14} color={colors.primary} />
                    <Text style={s.reasonText}>Generated from a repeat ride rule</Text>
                  </View>
                </>
              )}

              {ride.confidence && (
                <>
                  <View style={s.conditionsDivider} />
                  <View style={s.confidenceRow}>
                    <Text style={s.confidenceLabel}>ROUTE CONFIDENCE</Text>
                    <Text style={[s.confidenceValue, { color: colors.primary }]}>{ride.confidence.toUpperCase()}</Text>
                  </View>
                  <AnimatedBar
                    targetPercent={ride.confidence === 'high' ? 90 : ride.confidence === 'medium' ? 55 : 25}
                    color={colors.primary}
                  />
                </>
              )}
            </View>
          </View>
        </FadeInView>

        {/* Edit ride */}
        <FadeInView delay={250}>
          <PressableScale style={s.editBtn} onPress={() => router.push(`/edit-ride/${ride.id}`)} scale={0.97} haptic>
            <Feather name="edit-2" size={16} color={colors.onSurface} />
            <Text style={s.editBtnText}>EDIT RIDE</Text>
          </PressableScale>
        </FadeInView>

        {/* Refresh weather */}
        <FadeInView delay={260}>
          <PressableScale style={[s.refreshBtn, refreshing && { opacity: 0.6 }]} onPress={handleRefreshWeather} scale={0.97} haptic>
            <Animated.View style={refreshIconStyle}>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
            </Animated.View>
            <Text style={s.refreshBtnText}>{refreshing ? 'FETCHING...' : 'REFRESH WEATHER'}</Text>
          </PressableScale>
        </FadeInView>

        {/* Delete */}
        <FadeInView delay={300}>
          <PressableScale style={s.deleteBtn} onPress={handleDelete} scale={0.97} haptic>
            <Text style={s.deleteBtnText}>DELETE RIDE</Text>
          </PressableScale>
        </FadeInView>
      </ScrollView>
    </>
  );
}

function LegRow({ label, status, colors: c }: { label: string; status: 'green' | 'orange' | 'red'; colors: Colors }) {
  const dot = { green: c.green, orange: c.orange, red: c.red }[status];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurfaceVariant, letterSpacing: 1 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
        <Text style={{ fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: dot, letterSpacing: 0.5 }}>{status.toUpperCase()}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value, colors: c }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurfaceVariant, letterSpacing: 1 }}>{label}</Text>
      <Text style={{ fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurface, letterSpacing: 0.5 }}>{value}</Text>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.headerBgStrong, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.surfaceLow },
  headerTitle: { fontFamily: typography.fontFamily.headline, fontSize: 20, letterSpacing: -0.5, color: c.onSurface },
  screen: { flex: 1, backgroundColor: c.background },
  content: { paddingTop: 32, paddingHorizontal: 24, gap: 12 },

  heroSection: { alignItems: 'center', marginBottom: 8, position: 'relative' },
  heroOuter: { width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: c.outlineAlpha10, alignItems: 'center', justifyContent: 'center' },
  heroMiddle: { width: 148, height: 148, borderRadius: 74, borderWidth: 1, borderColor: c.outlineAlpha15, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  heroInner: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  heroBadge: { position: 'absolute', top: 8, right: 0, backgroundColor: c.surfaceHighest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2, borderWidth: 1, borderColor: c.outlineAlpha15 },
  heroBadgeText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurface, letterSpacing: 0.5 },
  heroTitle: { fontFamily: typography.fontFamily.headline, fontSize: 26, color: c.onSurface, letterSpacing: -0.5, marginTop: 20, textAlign: 'center' },
  heroSub: { fontFamily: typography.fontFamily.body, fontSize: typography.size.xs, color: c.onSurfaceVariant, letterSpacing: 2, marginTop: 6, textAlign: 'center' },

  criticalCard: { backgroundColor: c.surfaceCard, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  cardAccent: { width: 4 },
  criticalContent: { flex: 1, padding: 20, gap: 12 },
  criticalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurfaceVariant, letterSpacing: 1.5 },
  criticalStat: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  criticalNumber: { fontFamily: typography.fontFamily.headline, fontSize: 52, color: c.onSurface, letterSpacing: -2, lineHeight: 56 },
  criticalUnit: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xl, color: c.onSurfaceVariant },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, letterSpacing: 1 },

  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: c.surfaceCard, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', minHeight: 110 },
  statContent: { flex: 1, padding: 16, gap: 20, justifyContent: 'space-between' },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  statNumber: { fontFamily: typography.fontFamily.headline, fontSize: 32, color: c.onSurface, letterSpacing: -1 },
  statUnit: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.md, color: c.onSurfaceVariant },
  statBg: { position: 'absolute', bottom: 12, right: 12 },

  conditionsCard: { backgroundColor: c.surfaceLow, borderRadius: 4, overflow: 'hidden' },
  conditionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingBottom: 0 },
  conditionsAccent: { width: 4, height: 24 },
  conditionsTitle: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.md, color: c.onSurface, letterSpacing: -0.3 },
  conditionsBody: { padding: 20, paddingTop: 12 },
  conditionsDivider: { height: 1, backgroundColor: c.outlineAlpha15, marginVertical: 12 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  reasonText: { fontFamily: typography.fontFamily.body, fontSize: typography.size.base, color: c.onSurfaceVariant, flex: 1 },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  confidenceLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurfaceVariant, letterSpacing: 1 },
  confidenceValue: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, letterSpacing: 1 },

  editBtn: { backgroundColor: c.surfaceLow, borderRadius: 2, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: c.outlineAlpha20, marginTop: 8 },
  editBtnText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.base, color: c.onSurface, letterSpacing: 2 },
  refreshBtn: { backgroundColor: c.surfaceCard, borderRadius: 2, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: c.outlineAlpha15, marginTop: 4 },
  refreshBtnText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.base, color: c.primary, letterSpacing: 2 },
  deleteBtn: { borderWidth: 1, borderColor: c.outlineAlpha25, borderRadius: 2, paddingVertical: 18, alignItems: 'center', marginTop: 4 },
  deleteBtnText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.base, color: c.outline, letterSpacing: 2 },
});
