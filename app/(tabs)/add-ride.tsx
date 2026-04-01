import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ride } from '../../types/ride';
import { saveRide } from '../../lib/ride-storage';
import { getTonightDefaults, getWeekendDefaults } from '../../lib/date-utils';
import { geocodeLocation, fetchWeatherForRide } from '../../lib/weather-api';
import { calculateTrafficLight, calculateConfidence } from '../../lib/weather-score';
import { UserPreferences, DEFAULT_PREFERENCES } from '../../types/weather';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../theme/colors';
import { AppHeader } from '../../components/AppHeader';
import { PressableScale } from '../../components/PressableScale';
import { typography } from '../../theme/typography';

const PREFS_KEY = 'lemoto:preferences';

function localDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function AddRideScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [destination, setDestination] = useState('');
  const [date, setDate] = useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); return d;
  });
  const [startTime, setStartTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(18, 0, 0, 0); return d;
  });
  const [durationMin, setDurationMin] = useState(120);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateStr = date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;

  // CTA idle breathing
  const ctaScale = useSharedValue(1);
  useEffect(() => {
    ctaScale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1800, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sine) }),
      ),
      -1, true,
    );
  }, []);
  const ctaAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  function applyQuickSelect(type: 'tonight' | 'weekend') {
    const d = type === 'tonight' ? getTonightDefaults() : getWeekendDefaults();
    const [y, mo, day] = d.date.split('-').map(Number);
    setDate(new Date(y, mo - 1, day));
    const [h, min] = d.startTime.split(':').map(Number);
    const t = new Date(); t.setHours(h, min, 0, 0); setStartTime(t);
    setDurationMin(d.durationHours * 60);
  }

  async function handleSave() {
    if (!destination.trim()) { Alert.alert('Destination required', 'Please enter a destination.'); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date < today) { Alert.alert('Past date', 'Please choose today or a future date.'); return; }
    setSaving(true);
    try {
      const rideDate = localDateString(date);
      const durationHours = durationMin / 60;

      // Geocode destination
      const geo = await geocodeLocation(destination.trim());
      const location = geo
        ? { lat: geo.lat, lon: geo.lon, label: geo.label }
        : { lat: 52.37, lon: 4.9, label: destination.trim() };

      // Build base ride
      const ride: Ride = {
        id: uuid(), label: destination.trim(), date: rideDate, startTime: timeStr,
        durationHours, location,
      };

      // Fetch weather + calculate status (best-effort — never blocks save)
      try {
        const [weatherData, prefsRaw] = await Promise.all([
          fetchWeatherForRide(location.lat, location.lon, rideDate, timeStr, durationHours),
          AsyncStorage.getItem(PREFS_KEY),
        ]);
        const prefs: UserPreferences = prefsRaw ? JSON.parse(prefsRaw) : DEFAULT_PREFERENCES;
        const { status, reasons } = calculateTrafficLight(weatherData, prefs);
        const confidence = calculateConfidence(rideDate);
        ride.weatherData = weatherData;
        ride.status = status;
        ride.reasons = reasons;
        ride.confidence = confidence;
        ride.fetchedAt = new Date().toISOString();
      } catch {
        // Weather failed — save without status, will show as unknown
      }

      await saveRide(ride);
      setDestination('');
    } catch { Alert.alert('Error', 'Could not save ride.'); }
    finally { setSaving(false); }
  }

  return (
    <View style={s.screen}>
      <AppHeader />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Quick Select */}
        <View style={s.block}>
          <Text style={s.fieldLabel}>QUICK SELECT</Text>
          <View style={s.quickRow}>
            <PressableScale style={s.quickCard} onPress={() => applyQuickSelect('tonight')} haptic>
              <Feather name="moon" size={24} color={colors.primary} style={{ marginBottom: 10 }} />
              <Text style={s.quickTitle}>TONIGHT</Text>
              <Text style={s.quickSub}>20:00 START</Text>
            </PressableScale>
            <PressableScale style={s.quickCard} onPress={() => applyQuickSelect('weekend')} haptic>
              <Feather name="calendar" size={24} color={colors.primary} style={{ marginBottom: 10 }} />
              <Text style={s.quickTitle}>WEEKEND</Text>
              <Text style={s.quickSub}>SATURDAY 09:00</Text>
            </PressableScale>
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
              placeholderTextColor={colors.surfaceHighest}
              value={destination}
              onChangeText={setDestination}
              autoCapitalize="characters"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Date & Time */}
        <View style={s.dateTimeRow}>
          <View style={s.dateTimeField}>
            <Text style={s.fieldLabel}>DEPARTURE DATE</Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker value={date} mode="date" display="default" minimumDate={new Date()} onChange={(_, d) => { if (d) setDate(d); }} style={s.iosPicker} />
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
              <DateTimePicker value={startTime} mode="time" display="default" minuteInterval={15} onChange={(_, t) => { if (t) setStartTime(t); }} style={s.iosPicker} />
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
        <Animated.View style={ctaAnimStyle}>
          <PressableScale style={[s.cta, saving && { opacity: 0.6 }]} onPress={handleSave} scale={0.97} haptic>
            <Text style={s.ctaText}>{saving ? 'SAVING...' : 'ADD RIDE'}</Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, gap: 32 },
  block: { gap: 12 },
  fieldLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 2 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, backgroundColor: c.surfaceCard, borderRadius: 4, padding: 20, borderWidth: 1, borderColor: c.surfaceHighest },
  quickTitle: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.md, color: c.onSurface, letterSpacing: -0.3 },
  quickSub: { fontFamily: typography.fontFamily.body, fontSize: typography.size.xs, color: c.outline, marginTop: 2 },
  inputGroup: { gap: 8 },
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
  sliderLabelText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, opacity: 0.5 },
  cta: { backgroundColor: c.lime, borderRadius: 4, paddingVertical: 20, alignItems: 'center', shadowColor: c.lime, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  ctaText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.limeText, letterSpacing: 1 },
});
