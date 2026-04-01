import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WeekSchedule } from '../types/schedule';
import { getSchedule, saveSchedule } from '../lib/schedule-storage';
import { saveRide } from '../lib/ride-storage';
import { Ride } from '../types/ride';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

const DURATIONS = [1, 1.5, 2, 3] as const;

// Ma–Zo volgorde (Europees)
const DAYS = [
  { value: 1, label: 'Ma' },
  { value: 2, label: 'Di' },
  { value: 3, label: 'Wo' },
  { value: 4, label: 'Do' },
  { value: 5, label: 'Vr' },
  { value: 6, label: 'Za' },
  { value: 0, label: 'Zo' },
];

function localDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getUpcomingDates(days: number[]): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (days.includes(d.getDay())) {
      dates.push(localDateString(d));
    }
  }
  return dates;
}

export default function WeekScheduleScreen() {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSchedule().then(setSchedule);
  }, []);

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
      const days = s.days.includes(day)
        ? s.days.filter((d) => d !== day)
        : [...s.days, day];
      return { ...s, days };
    });
  }

  async function handleSave() {
    if (!schedule) return;
    await saveSchedule(schedule);
    Alert.alert('Opgeslagen', 'Weekschema opgeslagen.');
  }

  async function handleGenerate() {
    if (!schedule) return;
    if (schedule.days.length === 0) {
      Alert.alert('Geen dagen geselecteerd', 'Selecteer minstens één dag.');
      return;
    }
    if (!schedule.location.label.trim()) {
      Alert.alert('Locatie vereist', 'Voer een locatie in.');
      return;
    }

    setSaving(true);
    try {
      await saveSchedule(schedule);
      const dates = getUpcomingDates(schedule.days);
      const rides: Ride[] = dates.map((date) => ({
        id: uuid(),
        label: schedule.label || 'Weekschema',
        date,
        startTime: schedule.startTime,
        durationHours: schedule.durationHours,
        location: schedule.location,
      }));
      for (const ride of rides) {
        await saveRide(ride);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Dagen */}
      <Text style={styles.fieldLabel}>Dagen</Text>
      <View style={styles.daysRow}>
        {DAYS.map(({ value, label }) => {
          const active = schedule.days.includes(value);
          return (
            <TouchableOpacity
              key={value}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
              onPress={() => toggleDay(value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, active && styles.dayTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Starttijd */}
      <Text style={styles.fieldLabel}>Starttijd</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={timeDate}
          mode="time"
          display="default"
          minuteInterval={15}
          onChange={(_, t) => {
            if (!t) return;
            const h = String(t.getHours()).padStart(2, '0');
            const m = String(t.getMinutes()).padStart(2, '0');
            setSchedule((s) => s ? { ...s, startTime: `${h}:${m}` } : s);
          }}
          style={styles.iosPicker}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.inputTouchable} onPress={() => setShowTime(true)} activeOpacity={0.7}>
            <Text style={[styles.inputText, { fontFamily: typography.fontFamily.mono }]}>
              {schedule.startTime}
            </Text>
          </TouchableOpacity>
          {showTime && (
            <DateTimePicker
              value={timeDate}
              mode="time"
              display="default"
              minuteInterval={15}
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

      {/* Duur */}
      <Text style={styles.fieldLabel}>Duur</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.durationBtn, schedule.durationHours === d && styles.durationBtnActive]}
            onPress={() => setSchedule((s) => s ? { ...s, durationHours: d } : s)}
            activeOpacity={0.7}
          >
            <Text style={[styles.durationText, schedule.durationHours === d && styles.durationTextActive]}>
              {d}u
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Label */}
      <Text style={styles.fieldLabel}>Label</Text>
      <TextInput
        style={styles.input}
        placeholder="bijv. Woon-werk"
        placeholderTextColor={colors.textMuted}
        value={schedule.label}
        onChangeText={(v) => setSchedule((s) => s ? { ...s, label: v } : s)}
        returnKeyType="next"
      />

      {/* Locatie */}
      <Text style={styles.fieldLabel}>Locatie</Text>
      <TextInput
        style={styles.input}
        placeholder="bijv. Amsterdam"
        placeholderTextColor={colors.textMuted}
        value={schedule.location.label}
        onChangeText={(v) =>
          setSchedule((s) => s ? { ...s, location: { ...s.location, label: v } } : s)
        }
        returnKeyType="done"
      />

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Genereert ritten voor de komende 7 dagen op de geselecteerde dagen. Al bestaande ritten worden niet overschreven.
        </Text>
      </View>

      {/* Knoppen */}
      <TouchableOpacity
        style={[styles.primaryBtn, saving && styles.btnDisabled]}
        onPress={handleGenerate}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>
          {saving ? 'Aanmaken...' : 'Ritten aanmaken voor deze week'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghostBtn} onPress={handleSave} activeOpacity={0.7}>
        <Text style={styles.ghostBtnText}>Schema opslaan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing['5'], paddingBottom: spacing['12'] },

  fieldLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing['2'],
    marginTop: spacing['5'],
  },

  daysRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  dayBtn: {
    flex: 1,
    paddingVertical: spacing['2'],
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBtnActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  dayText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  dayTextActive: {
    color: colors.white,
  },

  inputTouchable: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    justifyContent: 'center',
  },
  inputText: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  iosPicker: {
    alignSelf: 'flex-start',
    marginLeft: -spacing['2'],
  },

  durationRow: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  durationBtn: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing['3'],
    alignItems: 'center',
  },
  durationBtnActive: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  durationText: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.base,
    color: colors.textPrimary,
  },
  durationTextActive: { color: colors.white },

  input: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },

  infoCard: {
    marginTop: spacing['6'],
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing['4'],
    ...shadows.card,
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  },

  primaryBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    paddingHorizontal: spacing['6'],
    paddingVertical: spacing['3'],
    alignItems: 'center',
    marginTop: spacing['6'],
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  ghostBtn: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing['6'],
    paddingVertical: spacing['3'],
    alignItems: 'center',
    marginTop: spacing['3'],
  },
  ghostBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  btnDisabled: { opacity: 0.5 },
});
