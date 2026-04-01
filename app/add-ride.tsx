import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ride } from '../types/ride';
import { saveRide } from '../lib/ride-storage';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const DURATIONS = [1, 1.5, 2, 3] as const;

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

export default function AddRideScreen() {
  const params = useLocalSearchParams<{ date?: string; startTime?: string; durationHours?: string }>();

  const [label, setLabel] = useState('');
  const [date, setDate] = useState<Date>(() => {
    if (params.date) return new Date(params.date + 'T00:00:00');
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [startTime, setStartTime] = useState<Date>(() => {
    const d = new Date();
    if (params.startTime) {
      const [h, m] = params.startTime.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(18, 0, 0, 0);
    }
    return d;
  });
  const [duration, setDuration] = useState<number>(
    params.durationHours ? Number(params.durationHours) : 2,
  );
  const [locationLabel, setLocationLabel] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateStr = date.toLocaleDateString('nl-NL', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;

  async function handleSave() {
    if (!locationLabel.trim()) {
      Alert.alert('Locatie vereist', 'Voer een locatie in.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      Alert.alert('Datum in het verleden', 'Kies een datum vandaag of later.');
      return;
    }
    setSaving(true);
    try {
      const ride: Ride = {
        id: uuid(),
        label: label.trim() || 'Naamloze rit',
        date: localDateString(date),
        startTime: timeStr,
        durationHours: duration,
        location: { lat: 52.37, lon: 4.9, label: locationLabel.trim() },
      };
      await saveRide(ride);
      router.back();
    } catch (e) {
      Alert.alert('Fout', 'Kon rit niet opslaan. Probeer opnieuw.');
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
      {/* Label */}
      <Text style={styles.fieldLabel}>Label</Text>
      <TextInput
        style={styles.input}
        placeholder="bijv. Woon-werk"
        placeholderTextColor={colors.textMuted}
        value={label}
        onChangeText={setLabel}
        returnKeyType="next"
      />

      {/* Datum */}
      <Text style={styles.fieldLabel}>Datum</Text>
      {Platform.OS === 'ios' ? (
        // iOS: inline compact picker — tap opens a sheet, onChange fires on confirm
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_, d) => { if (d) setDate(d); }}
          style={styles.iosPicker}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.inputTouchable} onPress={() => setShowDate(true)} activeOpacity={0.7}>
            <Text style={styles.inputText}>{dateStr}</Text>
          </TouchableOpacity>
          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_, d) => { setShowDate(false); if (d) setDate(d); }}
            />
          )}
        </>
      )}

      {/* Starttijd */}
      <Text style={styles.fieldLabel}>Starttijd</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          minuteInterval={15}
          onChange={(_, t) => { if (t) setStartTime(t); }}
          style={styles.iosPicker}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.inputTouchable} onPress={() => setShowTime(true)} activeOpacity={0.7}>
            <Text style={[styles.inputText, { fontFamily: typography.fontFamily.mono }]}>{timeStr}</Text>
          </TouchableOpacity>
          {showTime && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              minuteInterval={15}
              onChange={(_, t) => { setShowTime(false); if (t) setStartTime(t); }}
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
            style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
            onPress={() => setDuration(d)}
            activeOpacity={0.7}
          >
            <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
              {d}u
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Locatie */}
      <Text style={styles.fieldLabel}>Locatie</Text>
      <TextInput
        style={styles.input}
        placeholder="bijv. Amsterdam"
        placeholderTextColor={colors.textMuted}
        value={locationLabel}
        onChangeText={setLocationLabel}
        returnKeyType="done"
      />

      {/* Opslaan */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Opslaan...' : 'Rit opslaan'}</Text>
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
    marginBottom: spacing['1'],
    marginTop: spacing['5'],
  },
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
  durationTextActive: {
    color: colors.white,
  },
  saveBtn: {
    backgroundColor: colors.black,
    borderRadius: radius.sm,
    paddingHorizontal: spacing['6'],
    paddingVertical: spacing['3'],
    alignItems: 'center',
    marginTop: spacing['8'],
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: colors.white,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
