import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../components/AppHeader';
import { FadeInView } from '../../components/FadeInView';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { Colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { UserPreferences, DEFAULT_PREFERENCES } from '../../types/weather';

const RAIN_OPTIONS = ['NONE', 'LIGHT', 'HEAVY'] as const;
const RAIN_MAP: UserPreferences['rainTolerance'][] = ['low', 'normal', 'high'];

const APPEAR_OPTIONS: { label: string; mode: ThemeMode; icon: 'sun' | 'moon' | 'smartphone' }[] = [
  { label: 'LIGHT', mode: 'light', icon: 'sun' },
  { label: 'SYSTEM', mode: 'system', icon: 'smartphone' },
  { label: 'DARK', mode: 'dark', icon: 'moon' },
];

const PREFS_KEY = 'lemoto:preferences';

export default function SettingsScreen() {
  const { colors, mode: themeMode, setMode } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  // Local slider state — updates live without hitting AsyncStorage
  const [localTemp, setLocalTemp] = useState(DEFAULT_PREFERENCES.minTempC);
  const [localWind, setLocalWind] = useState(DEFAULT_PREFERENCES.maxWindKmh);

  // Lime tile pop-in on focus — only transform + opacity, NOT flex (layout on UI thread)
  const limeScale = useSharedValue(0.88);
  const limeOpacity = useSharedValue(0);
  const limeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: limeScale.value }],
    opacity: limeOpacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      // Animate lime tile
      limeScale.value = 0.88;
      limeOpacity.value = 0;
      limeScale.value = withSpring(1, { damping: 14, stiffness: 180, mass: 0.8 });
      limeOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });

      // Load saved preferences
      AsyncStorage.getItem(PREFS_KEY).then((raw) => {
        if (raw) {
          const p: UserPreferences = JSON.parse(raw);
          setPrefs(p);
          setLocalTemp(p.minTempC);
          setLocalWind(p.maxWindKmh);
        }
      });
    }, []),
  );

  async function savePrefs(updated: UserPreferences) {
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleDeleteData() {
    Alert.alert('Clear all rides', 'This will delete all your rides. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await AsyncStorage.removeItem('lemoto:rides'); },
      },
    ]);
  }

  const rainIndex = prefs.rainTolerance === 'low' ? 0 : prefs.rainTolerance === 'normal' ? 1 : 2;

  return (
    <View style={s.screen}>
      <AppHeader />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Profile + Lime tile */}
        <View style={s.profileGrid}>
          <View style={s.profileCard}>
            <Text style={s.profileSubLabel}>USER PROFILE</Text>
            <Text style={s.profileName}>RIDER</Text>
            <View style={s.profileStats}>
              <View style={s.profileStatRow}>
                <Text style={s.profileStatLabel}>APP</Text>
                <Text style={s.profileStatValue}>LEMOTO</Text>
              </View>
            </View>
          </View>
          {/* flex: 1 lives in the static style, animation only handles opacity + scale */}
          <Animated.View style={[s.limeCard, limeAnimStyle]}>
            <Text style={s.limeStatLabel}>PREFERENCES</Text>
            <Text style={s.limeStatValue}>{saved ? 'SAVED ✓' : 'ACTIVE'}</Text>
          </Animated.View>
        </View>

        {/* Appearance */}
        <FadeInView delay={60}>
          <View style={s.section}>
            <SectionHeader title="APPEARANCE" colors={colors} />
            <View style={s.card}>
              <View style={s.segmentRow}>
                {APPEAR_OPTIONS.map(({ label, mode, icon }) => {
                  const active = themeMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[s.segmentBtn, active && s.segmentBtnActive]}
                      onPress={() => setMode(mode)}
                      activeOpacity={0.7}
                    >
                      <Feather name={icon} size={14} color={active ? colors.white : colors.outline} />
                      <Text style={[s.segmentText, active && s.segmentTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Weather Tolerance */}
        <FadeInView delay={120}>
          <View style={s.section}>
            <SectionHeader title="WEATHER TOLERANCE" colors={colors} />

            {/* Temperature slider */}
            <View style={s.sliderBlock}>
              <View style={s.sliderBlockHeader}>
                <Text style={s.sliderLabel}>MINIMUM TEMPERATURE</Text>
                <Text style={s.sliderValue}>{localTemp}°C</Text>
              </View>
              <Slider
                style={s.slider}
                minimumValue={0}
                maximumValue={20}
                step={1}
                value={localTemp}
                onValueChange={(v) => setLocalTemp(Math.round(v))}
                onSlidingComplete={(v) => savePrefs({ ...prefs, minTempC: Math.round(v) })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surfaceHighest}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Wind slider */}
            <View style={[s.sliderBlock, { marginTop: 2 }]}>
              <View style={s.sliderBlockHeader}>
                <Text style={s.sliderLabel}>MAXIMUM WIND</Text>
                <Text style={s.sliderValue}>{localWind} KM/H</Text>
              </View>
              <Slider
                style={s.slider}
                minimumValue={10}
                maximumValue={80}
                step={5}
                value={localWind}
                onValueChange={(v) => setLocalWind(Math.round(v / 5) * 5)}
                onSlidingComplete={(v) => savePrefs({ ...prefs, maxWindKmh: Math.round(v / 5) * 5 })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surfaceHighest}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Rain tolerance */}
            <View style={s.card}>
              <Text style={s.sliderLabel}>RAIN TOLERANCE</Text>
              <View style={[s.segmentRow, { marginTop: 16 }]}>
                {RAIN_OPTIONS.map((opt, i) => {
                  const active = rainIndex === i;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[s.segmentBtn, active && s.segmentBtnActive]}
                      onPress={() => savePrefs({ ...prefs, rainTolerance: RAIN_MAP[i] })}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.segmentText, active && s.segmentTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Data */}
        <View style={s.section}>
          <TouchableOpacity style={s.listRow} onPress={handleDeleteData} activeOpacity={0.7}>
            <View style={s.listRowLeft}>
              <View style={s.listIconBox}>
                <Feather name="trash-2" size={18} color={colors.error} />
              </View>
              <Text style={[s.listRowLabel, { color: colors.error }]}>DELETE ALL RIDES</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, colors: c }: { title: string; colors: Colors }) {
  return (
    <View style={headerStatic.row}>
      <Text style={[headerStatic.title, { color: c.onSurface }]}>{title}</Text>
      <View style={[headerStatic.line, { backgroundColor: c.surfaceHigh }]} />
    </View>
  );
}
const headerStatic = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  title: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.sm, letterSpacing: 2 },
  line: { flex: 1, height: 1 },
});

const makeStyles = (c: Colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  // Profile row (full-bleed, no horizontal padding)
  profileGrid: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  profileCard: {
    flex: 2,
    backgroundColor: c.surfaceCard,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  profileSubLabel: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.size.xs,
    color: c.outline,
    letterSpacing: 2,
    marginBottom: 4,
  },
  profileName: {
    fontFamily: typography.fontFamily.headline,
    fontSize: 36,
    color: c.onSurface,
    letterSpacing: -1,
  },
  profileStats: { gap: 8, marginTop: 16 },
  profileStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: c.surfaceContainer,
    paddingBottom: 6,
  },
  profileStatLabel: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.size.xs,
    color: c.outline,
    letterSpacing: 1,
  },
  profileStatValue: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.size.xs,
    color: c.onSurface,
  },
  // flex: 1 stays here (not in animated style)
  limeCard: {
    flex: 1,
    backgroundColor: c.lime,
    padding: 24,
    justifyContent: 'flex-end',
  },
  limeStatLabel: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.size.xs,
    color: c.limeText,
    letterSpacing: 2,
    opacity: 0.7,
    marginBottom: 4,
  },
  limeStatValue: {
    fontFamily: typography.fontFamily.headline,
    fontSize: 20,
    color: c.limeText,
    letterSpacing: -0.3,
  },

  // Sections
  section: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 4 },
  card: { backgroundColor: c.surfaceCard, padding: 20 },

  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: c.outlineAlpha20,
    borderRadius: 2,
  },
  segmentBtnActive: { backgroundColor: c.onSurface, borderColor: c.onSurface },
  segmentText: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.size.xs,
    color: c.onSurface,
    letterSpacing: 1.5,
  },
  segmentTextActive: { color: c.white },

  sliderBlock: { backgroundColor: c.surfaceLow, padding: 20, gap: 16 },
  sliderBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sliderLabel: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.size.xs,
    color: c.outline,
    letterSpacing: 1.5,
  },
  sliderValue: {
    fontFamily: typography.fontFamily.headline,
    fontSize: 22,
    color: c.onSurface,
    letterSpacing: -0.5,
  },
  slider: { height: 24, marginHorizontal: -4 },

  listRow: {
    backgroundColor: c.surfaceLow,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  listIconBox: {
    width: 36,
    height: 36,
    backgroundColor: c.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRowLabel: {
    fontFamily: typography.fontFamily.headline,
    fontSize: typography.size.xs,
    color: c.onSurface,
    letterSpacing: 1.5,
  },
});
