import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride } from '../../types/ride';
import { getRides, updateRide } from '../../lib/ride-storage';
import { geocodeLocation, fetchWeatherForRide } from '../../lib/weather-api';
import { calculateRideScore, calculateConfidence } from '../../lib/weather-score';
import { UserPreferences, DEFAULT_PREFERENCES } from '../../types/weather';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../theme/colors';
import { AppHeader } from '../../components/AppHeader';
import { PressableScale } from '../../components/PressableScale';
import { typography } from '../../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PREFS_KEY = 'lemoto:preferences';

function localDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getEndTime(startTime: string, durationHours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const t = h * 60 + m + durationHours * 60;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

export default function EditRideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [ride, setRide] = useState<Ride | null>(null);
  const [rideLabel, setRideLabel] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(() => { const d = new Date(); d.setHours(18, 0, 0, 0); return d; });
  const [durationMin, setDurationMin] = useState(120);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geoFallback, setGeoFallback] = useState(false);

  useEffect(() => {
    getRides().then((rides) => {
      const found = rides.find((r) => r.id === id);
      if (!found) return;
      setRide(found);
      setRideLabel(found.label);
      setDestination(found.location.label);
      const [y, mo, day] = found.date.split('-').map(Number);
      setDate(new Date(y, mo - 1, day));
      const [h, m] = found.startTime.split(':').map(Number);
      const t = new Date(); t.setHours(h, m, 0, 0); setStartTime(t);
      setDurationMin(found.durationHours * 60);
    });
  }, [id]);

  const dateStr = date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;

  async function handleSave() {
    if (!ride) return;
    if (!destination.trim()) { Alert.alert('Destination required', 'Please enter a destination.'); return; }
    setSaving(true);
    setGeoFallback(false);
    try {
      const rideDate = localDateString(date);
      const durationHours = durationMin / 60;

      // Geocode destination (best-effort)
      let geo = null;
      try { geo = await geocodeLocation(destination.trim()); } catch { /* network error */ }
      if (!geo) setGeoFallback(true);
      const location = geo
        ? { lat: geo.lat, lon: geo.lon, label: geo.label }
        : { lat: ride.location.lat, lon: ride.location.lon, label: destination.trim() };

      const updates: Partial<Ride> = {
        label: rideLabel.trim() || destination.trim(),
        date: rideDate,
        startTime: timeStr,
        durationHours,
        location,
      };

      // Re-fetch weather for updated date/time/location
      try {
        const endTime = getEndTime(timeStr, durationHours);
        const [outboundWeather, returnWeather, prefsRaw] = await Promise.all([
          fetchWeatherForRide(location.lat, location.lon, rideDate, timeStr, 1),
          fetchWeatherForRide(location.lat, location.lon, rideDate, endTime, 1),
          AsyncStorage.getItem(PREFS_KEY),
        ]);
        const prefs: UserPreferences = prefsRaw ? JSON.parse(prefsRaw) : DEFAULT_PREFERENCES;
        const { overallStatus, outboundStatus, returnStatus, reasons } = calculateRideScore(outboundWeather, returnWeather, prefs);
        updates.weatherData = outboundWeather;
        updates.returnWeatherData = returnWeather;
        updates.status = overallStatus;
        updates.outboundStatus = outboundStatus;
        updates.returnStatus = returnStatus;
        updates.reasons = reasons;
        updates.confidence = calculateConfidence(rideDate);
        updates.fetchedAt = new Date().toISOString();
      } catch {
        // Weather failed — save other changes without re-scoring
      }

      await updateRide(ride.id, updates);
      router.back();
    } catch { Alert.alert('Error', 'Could not save changes.'); }
    finally { setSaving(false); }
  }

  if (!ride) return null;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>EDIT RIDE</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Ride name */}
        <View style={s.inputGroup}>
          <Text style={s.fieldLabel}>RIDE NAME</Text>
          <View style={s.underlineRow}>
            <Feather name="tag" size={18} color={colors.outline} />
            <TextInput
              style={s.underlineInput}
              placeholder="E.G. WOON-WERK (OPTIONAL)"
              placeholderTextColor={colors.outlineAlpha25}
              value={rideLabel}
              onChangeText={setRideLabel}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Destination */}
        <View style={s.inputGroup}>
          <Text style={s.fieldLabel}>DESTINATION</Text>
          <View style={s.underlineRow}>
            <Feather name="navigation" size={18} color={colors.outline} />
            <TextInput
              style={s.underlineInput}
              placeholder="ENTER LOCATION..."
              placeholderTextColor={colors.outlineAlpha25}
              value={destination}
              onChangeText={(t) => { setDestination(t); setGeoFallback(false); }}
              autoCapitalize="characters"
              returnKeyType="done"
            />
          </View>
          {geoFallback && (
            <View style={s.geoFallbackRow}>
              <Feather name="alert-circle" size={12} color={colors.orange} />
              <Text style={s.geoFallbackText}>Location not found — keeping existing coordinates</Text>
            </View>
          )}
        </View>

        {/* Date & Time */}
        <View style={s.dateTimeRow}>
          <View style={s.dateTimeField}>
            <Text style={s.fieldLabel}>DATE</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker value={date} mode="date" display="default" minimumDate={new Date()} themeVariant={isDark ? 'dark' : 'light'} onChange={(_, d) => { if (d) setDate(d); }} style={s.iosPicker} />
            ) : (
              <>
                <TouchableOpacity style={s.underlineRow} onPress={() => setShowDate(true)} activeOpacity={0.7}>
                  <Feather name="calendar" size={18} color={colors.outline} />
                  <Text style={s.underlineText}>{dateStr}</Text>
                </TouchableOpacity>
                {showDate && <DateTimePicker value={date} mode="date" display="default" minimumDate={new Date()} onChange={(_, d) => { setShowDate(false); if (d) setDate(d); }} />}
              </>
            )}
          </View>
          <View style={s.dateTimeField}>
            <Text style={s.fieldLabel}>TIME</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker value={startTime} mode="time" display="default" minuteInterval={15} themeVariant={isDark ? 'dark' : 'light'} onChange={(_, t) => { if (t) setStartTime(t); }} style={s.iosPicker} />
            ) : (
              <>
                <TouchableOpacity style={s.underlineRow} onPress={() => setShowTime(true)} activeOpacity={0.7}>
                  <Feather name="clock" size={18} color={colors.outline} />
                  <Text style={s.underlineText}>{timeStr}</Text>
                </TouchableOpacity>
                {showTime && <DateTimePicker value={startTime} mode="time" display="default" minuteInterval={15} onChange={(_, t) => { setShowTime(false); if (t) setStartTime(t); }} />}
              </>
            )}
          </View>
        </View>

        {/* Duration */}
        <View style={s.sliderCard}>
          <View style={s.sliderHeader}>
            <Text style={s.fieldLabel}>EXPECTED DURATION</Text>
            <View style={s.durationValue}>
              <Text style={s.durationNumber}>{durationMin}</Text>
              <Text style={s.durationUnit}>MIN</Text>
            </View>
          </View>
          <Slider
            style={s.slider}
            minimumValue={30} maximumValue={480} step={30} value={durationMin}
            onValueChange={setDurationMin}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.surfaceHighest}
            thumbTintColor={colors.primary}
          />
          <View style={s.sliderLabels}>
            <Text style={s.sliderLabelText}>30M</Text>
            <Text style={s.sliderLabelText}>8H</Text>
          </View>
        </View>

        {/* CTA */}
        <PressableScale style={[s.cta, saving && { opacity: 0.6 }]} onPress={handleSave} scale={0.97} haptic disabled={saving}>
          <Text style={s.ctaText}>{saving ? 'SAVING...' : 'SAVE CHANGES'}</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.headerBgStrong, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.surfaceLow },
  headerTitle: { fontFamily: typography.fontFamily.headline, fontSize: 20, letterSpacing: -0.5, color: c.onSurface },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, gap: 32 },
  fieldLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 2 },
  inputGroup: { gap: 8 },
  geoFallbackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  geoFallbackText: { fontFamily: typography.fontFamily.body, fontSize: typography.size.xs, color: c.orange },
  underlineRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.outlineAlpha25, paddingVertical: 10, gap: 8 },
  underlineInput: { flex: 1, fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface, letterSpacing: -0.3 },
  underlineText: { flex: 1, fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface },
  iosPicker: { alignSelf: 'flex-start', marginLeft: -8, marginTop: 2 },
  dateTimeRow: { flexDirection: 'row', gap: 24 },
  dateTimeField: { flex: 1, gap: 8 },
  sliderCard: { backgroundColor: c.surfaceLow, borderRadius: 4, padding: 20, gap: 16 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  durationValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  durationNumber: { fontFamily: typography.fontFamily.headline, fontSize: 36, color: c.primary, letterSpacing: -1, lineHeight: 40 },
  durationUnit: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1 },
  slider: { height: 24, marginHorizontal: -4 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabelText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline },
  cta: { backgroundColor: c.lime, borderRadius: 4, paddingVertical: 20, alignItems: 'center', shadowColor: c.lime, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  ctaText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.limeText, letterSpacing: 1 },
});
