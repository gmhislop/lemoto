import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WeekSchedule } from '../types/schedule';
import { getSchedule, saveSchedule } from '../lib/schedule-storage';
import { saveRide } from '../lib/ride-storage';
import { geocodeLocation, fetchWeatherForRide } from '../lib/weather-api';
import { calculateRideScore, calculateConfidence } from '../lib/weather-score';
import { DEFAULT_PREFERENCES } from '../types/weather';
import { Ride } from '../types/ride';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { typography } from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'lemoto:preferences';
const DURATIONS = [1, 1.5, 2, 3] as const;
const DAYS = [
  { value: 1, label: 'MA' }, { value: 2, label: 'DI' }, { value: 3, label: 'WO' },
  { value: 4, label: 'DO' }, { value: 5, label: 'VR' }, { value: 6, label: 'ZA' },
  { value: 0, label: 'ZO' },
];

function getEndTime(startTime: string, durationHours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const t = h * 60 + m + durationHours * 60;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function localDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getUpcomingDates(days: number[]): string[] {
  const dates: string[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    if (days.includes(d.getDay())) dates.push(localDateString(d));
  }
  return dates;
}

export default function WeekScheduleScreen() {
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSchedule().then(setSchedule); }, []);

  if (!schedule) return null;

  const timeDate = (() => {
    const d = new Date();
    const [h, m] = schedule.startTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  })();

  function toggleDay(day: number) {
    setSchedule((s) => {
      if (!s) return s;
      const days = s.days.includes(day) ? s.days.filter((d) => d !== day) : [...s.days, day];
      return { ...s, days };
    });
  }

  async function handleGenerate() {
    if (!schedule) return;
    if (schedule.days.length === 0) { Alert.alert('Geen dagen', 'Selecteer minstens één dag.'); return; }
    if (!schedule.location.label.trim()) { Alert.alert('Locatie vereist', 'Voer een locatie in.'); return; }
    setSaving(true);
    try {
      await saveSchedule(schedule);

      // Geocode once for all rides
      const geo = await geocodeLocation(schedule.location.label.trim());
      const location = geo
        ? { lat: geo.lat, lon: geo.lon, label: geo.label }
        : { ...schedule.location };

      const prefsRaw = await AsyncStorage.getItem(PREFS_KEY);
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : DEFAULT_PREFERENCES;

      const dates = getUpcomingDates(schedule.days);
      for (const date of dates) {
        const ride: Ride = {
          id: uuid(),
          label: schedule.label || 'Weekschema',
          date,
          startTime: schedule.startTime,
          durationHours: schedule.durationHours,
          location,
        };
        try {
          const endTime = getEndTime(schedule.startTime, schedule.durationHours);
          const [outboundWeather, returnWeather] = await Promise.all([
            fetchWeatherForRide(location.lat, location.lon, date, schedule.startTime, 1),
            fetchWeatherForRide(location.lat, location.lon, date, endTime, 1),
          ]);
          const { overallStatus, outboundStatus, returnStatus, reasons } = calculateRideScore(outboundWeather, returnWeather, prefs);
          ride.weatherData = outboundWeather;
          ride.returnWeatherData = returnWeather;
          ride.status = overallStatus;
          ride.outboundStatus = outboundStatus;
          ride.returnStatus = returnStatus;
          ride.reasons = reasons;
          ride.confidence = calculateConfidence(date);
          ride.fetchedAt = new Date().toISOString();
        } catch { /* weather failed — save without */ }
        await saveRide(ride);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>WEEK SCHEMA</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={s.screen}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Days */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>DAGEN</Text>
          <View style={s.daysRow}>
            {DAYS.map(({ value, label }) => {
              const active = schedule.days.includes(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[s.dayBtn, active && s.dayBtnActive]}
                  onPress={() => toggleDay(value)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dayText, active && s.dayTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Start time */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>STARTTIJD</Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={timeDate} mode="time" display="default" minuteInterval={15} themeVariant={isDark ? 'dark' : 'light'}
              onChange={(_, t) => {
                if (!t) return;
                const h = String(t.getHours()).padStart(2, '0');
                const m = String(t.getMinutes()).padStart(2, '0');
                setSchedule((s) => s ? { ...s, startTime: `${h}:${m}` } : s);
              }}
              style={{ alignSelf: 'flex-start', marginLeft: -8 }}
            />
          ) : (
            <>
              <TouchableOpacity style={s.underlineRow} onPress={() => setShowTime(true)} activeOpacity={0.7}>
                <Feather name="clock" size={18} color={colors.outline} />
                <Text style={s.underlineText}>{schedule.startTime}</Text>
              </TouchableOpacity>
              {showTime && (
                <DateTimePicker
                  value={timeDate} mode="time" display="default" minuteInterval={15}
                  onChange={(_, t) => {
                    setShowTime(false);
                    if (!t) return;
                    const h = String(t.getHours()).padStart(2, '0');
                    const m = String(t.getMinutes()).padStart(2, '0');
                    setSchedule((s) => s ? { ...s, startTime: `${h}:${m}` } : s);
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* Duration */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>DUUR</Text>
          <View style={s.segmentRow}>
            {DURATIONS.map((d) => {
              const active = schedule.durationHours === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[s.segmentBtn, active && s.segmentBtnActive]}
                  onPress={() => setSchedule((s) => s ? { ...s, durationHours: d } : s)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.segmentText, active && s.segmentTextActive]}>{d}U</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Label */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>LABEL</Text>
          <View style={s.underlineRow}>
            <Feather name="tag" size={18} color={colors.outline} />
            <TextInput
              style={s.underlineInput}
              placeholder="BIJV. WOON-WERK"
              placeholderTextColor={colors.surfaceHighest}
              value={schedule.label}
              onChangeText={(v) => setSchedule((s) => s ? { ...s, label: v } : s)}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Location */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>LOCATIE</Text>
          <View style={s.underlineRow}>
            <Feather name="navigation" size={18} color={colors.outline} />
            <TextInput
              style={s.underlineInput}
              placeholder="BIJV. AMSTERDAM"
              placeholderTextColor={colors.surfaceHighest}
              value={schedule.location.label}
              onChangeText={(v) =>
                setSchedule((s) => s ? { ...s, location: { ...s.location, label: v } } : s)
              }
              autoCapitalize="characters"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Feather name="info" size={14} color={colors.outline} />
          <Text style={s.infoText}>
            Genereert ritten voor de komende 7 dagen op de geselecteerde dagen. Weerdata wordt direct opgehaald.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[s.cta, saving && { opacity: 0.6 }]}
          onPress={handleGenerate}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={s.ctaText}>{saving ? 'AANMAKEN...' : 'RITTEN AANMAKEN'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: c.headerBgStrong, paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: c.surfaceLow,
  },
  headerTitle: { fontFamily: typography.fontFamily.headline, fontSize: 20, letterSpacing: -0.5, color: c.onSurface },
  screen: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 24, paddingTop: 28, gap: 28 },

  block: { gap: 12 },
  fieldLabel: {
    fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs,
    color: c.outline, letterSpacing: 2,
  },

  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: c.outlineAlpha20, borderRadius: 2,
  },
  dayBtnActive: { backgroundColor: c.onSurfaceVariant, borderColor: c.onSurfaceVariant },
  dayText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurface, letterSpacing: 0.5 },
  dayTextActive: { color: c.background },

  underlineRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: c.outlineAlpha25,
    paddingVertical: 10, gap: 8,
  },
  underlineText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface },
  underlineInput: { flex: 1, fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface, letterSpacing: -0.3 },

  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: c.outlineAlpha20, borderRadius: 2,
  },
  segmentBtnActive: { backgroundColor: c.onSurfaceVariant, borderColor: c.onSurfaceVariant },
  segmentText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurface, letterSpacing: 1 },
  segmentTextActive: { color: c.background },

  infoCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: c.surfaceLow, padding: 16, borderRadius: 2,
  },
  infoText: {
    flex: 1, fontFamily: typography.fontFamily.body, fontSize: typography.size.base,
    color: c.outline, lineHeight: typography.size.base * 1.5,
  },

  cta: {
    backgroundColor: c.lime, borderRadius: 2, paddingVertical: 20, alignItems: 'center',
    shadowColor: c.lime, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  ctaText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.limeText, letterSpacing: 1 },
});
