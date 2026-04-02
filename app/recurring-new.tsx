import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecurringRide } from '../types/recurring';
import { saveRecurringRide } from '../lib/recurring-storage';
import { geocodeLocation } from '../lib/weather-api';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { PressableScale } from '../components/PressableScale';

const DAYS = [
  { value: 1, label: 'MA' }, { value: 2, label: 'DI' }, { value: 3, label: 'WO' },
  { value: 4, label: 'DO' }, { value: 5, label: 'VR' }, { value: 6, label: 'ZA' },
  { value: 0, label: 'ZO' },
];
const DURATIONS = [0.5, 1, 1.5, 2, 3] as const;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function RecurringNewScreen() {
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [label, setLabel] = useState('');
  const [location, setLocation] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(18, 0, 0, 0); return d;
  });
  const [durationHours, setDurationHours] = useState<number>(1);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSave() {
    if (!label.trim()) { Alert.alert('Label required', 'Give this repeat ride a name.'); return; }
    if (!location.trim()) { Alert.alert('Location required', 'Enter a location.'); return; }
    if (!daysOfWeek.length) { Alert.alert('Select days', 'Choose at least one day.'); return; }
    setSaving(true);
    try {
      let geo = null;
      try { geo = await geocodeLocation(location.trim()); } catch {}
      const loc = geo
        ? { lat: geo.lat, lon: geo.lon, label: geo.label }
        : { lat: 52.37, lon: 4.9, label: location.trim() };

      const ride: RecurringRide = {
        id: uuid(),
        label: label.trim(),
        location: loc,
        daysOfWeek,
        startTime: timeStr,
        durationHours,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await saveRecurringRide(ride);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save repeat ride.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>NEW REPEAT RIDE</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={s.screen}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Label */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>NAAM</Text>
          <View style={s.underlineRow}>
            <Feather name="tag" size={18} color={colors.outline} />
            <TextInput
              style={s.underlineInput}
              placeholder="BIJV. WOON-WERK"
              placeholderTextColor={colors.outlineAlpha25}
              value={label}
              onChangeText={setLabel}
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
              placeholderTextColor={colors.outlineAlpha25}
              value={location}
              onChangeText={setLocation}
              autoCapitalize="characters"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Days */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>DAGEN</Text>
          <View style={s.daysRow}>
            {DAYS.map(({ value, label: dayLabel }) => {
              const active = daysOfWeek.includes(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[s.dayBtn, active && s.dayBtnActive]}
                  onPress={() => toggleDay(value)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dayText, active && s.dayTextActive]}>{dayLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>STARTTIJD</Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={startTime} mode="time" display="default" minuteInterval={15}
              themeVariant={isDark ? 'dark' : 'light'}
              onChange={(_, t) => { if (t) setStartTime(t); }}
              style={{ alignSelf: 'flex-start', marginLeft: -8 }}
            />
          ) : (
            <>
              <TouchableOpacity style={s.underlineRow} onPress={() => setShowTime(true)} activeOpacity={0.7}>
                <Feather name="clock" size={18} color={colors.outline} />
                <Text style={s.underlineText}>{timeStr}</Text>
              </TouchableOpacity>
              {showTime && (
                <DateTimePicker
                  value={startTime} mode="time" display="default" minuteInterval={15}
                  themeVariant={isDark ? 'dark' : 'light'}
                  onChange={(_, t) => { setShowTime(false); if (t) setStartTime(t); }}
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
              const active = durationHours === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[s.segmentBtn, active && s.segmentBtnActive]}
                  onPress={() => setDurationHours(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.segmentText, active && s.segmentTextActive]}>
                    {d < 1 ? '30M' : `${d}U`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Feather name="info" size={14} color={colors.outline} />
          <Text style={s.infoText}>
            Lemoto genereert automatisch ritten voor de komende 14 dagen en vernieuwd het weer bij elke app-opening.
          </Text>
        </View>

        {/* CTA */}
        <PressableScale
          style={[s.cta, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          scale={0.97}
          haptic
          disabled={saving}
        >
          <Text style={s.ctaText}>{saving ? 'OPSLAAN...' : 'HERHALING INSTELLEN'}</Text>
        </PressableScale>
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
  fieldLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 2 },

  underlineRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: c.outlineAlpha25, paddingVertical: 10, gap: 8,
  },
  underlineText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface },
  underlineInput: { flex: 1, fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface, letterSpacing: -0.3 },

  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: c.outlineAlpha20, borderRadius: 2 },
  dayBtnActive: { backgroundColor: c.onSurfaceVariant, borderColor: c.onSurfaceVariant },
  dayText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurface, letterSpacing: 0.5 },
  dayTextActive: { color: c.background },

  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: c.outlineAlpha20, borderRadius: 2 },
  segmentBtnActive: { backgroundColor: c.onSurfaceVariant, borderColor: c.onSurfaceVariant },
  segmentText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.onSurface, letterSpacing: 1 },
  segmentTextActive: { color: c.background },

  infoCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: c.surfaceLow, padding: 16, borderRadius: 2 },
  infoText: { flex: 1, fontFamily: typography.fontFamily.body, fontSize: typography.size.base, color: c.outline, lineHeight: typography.size.base * 1.5 },

  cta: { backgroundColor: c.lime, borderRadius: 2, paddingVertical: 20, alignItems: 'center', shadowColor: c.lime, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  ctaText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.limeText, letterSpacing: 1 },
});
