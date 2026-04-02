import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecurringRide } from '../types/recurring';
import { getRecurringRides, updateRecurringRide, deleteRecurringRide } from '../lib/recurring-storage';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { FadeInView } from '../components/FadeInView';
import { PressableScale } from '../components/PressableScale';

const DAY_LABELS = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'];

function formatDays(days: number[]): string {
  return [...days].sort((a, b) => a - b).map((d) => DAY_LABELS[d]).join(' · ');
}

export default function RecurringScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState<RecurringRide[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecurringRides().then(setRides);
    }, []),
  );

  async function handleToggle(id: string, active: boolean) {
    await updateRecurringRide(id, { active });
    setRides((prev) => prev.map((r) => r.id === id ? { ...r, active } : r));
  }

  function handleDelete(id: string, label: string) {
    Alert.alert(
      'Delete repeat ride',
      `Remove "${label}"? Existing generated rides are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteRecurringRide(id);
            setRides((prev) => prev.filter((r) => r.id !== id));
          },
        },
      ],
    );
  }

  return (
    <>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>REPEAT RIDES</Text>
        <TouchableOpacity onPress={() => router.push('/recurring-new')} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
          <Feather name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.screen}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {rides.length === 0 ? (
          <FadeInView>
            <View style={s.empty}>
              <Feather name="repeat" size={36} color={colors.outline} style={{ marginBottom: 16 }} />
              <Text style={s.emptyTitle}>NO REPEAT RIDES</Text>
              <Text style={s.emptySub}>Set up a recurring ride and the app generates instances automatically.</Text>
              <PressableScale style={s.emptyBtn} onPress={() => router.push('/recurring-new')} haptic>
                <Text style={s.emptyBtnText}>ADD REPEAT RIDE</Text>
              </PressableScale>
            </View>
          </FadeInView>
        ) : (
          <>
            {rides.map((ride, i) => (
              <FadeInView key={ride.id} delay={i * 50}>
                <View style={[s.card, !ride.active && s.cardInactive]}>
                  <View style={s.cardTop}>
                    <View style={s.cardLeft}>
                      <Text style={s.cardLabel}>{ride.label.toUpperCase()}</Text>
                      <Text style={s.cardLocation}>{ride.location.label}</Text>
                    </View>
                    <Switch
                      value={ride.active}
                      onValueChange={(v) => handleToggle(ride.id, v)}
                      trackColor={{ false: colors.surfaceHighest, true: colors.lime }}
                      thumbColor={colors.background}
                    />
                  </View>
                  <View style={s.cardMeta}>
                    <View style={s.metaChip}>
                      <Feather name="repeat" size={11} color={colors.outline} />
                      <Text style={s.metaText}>{formatDays(ride.daysOfWeek)}</Text>
                    </View>
                    <View style={s.metaChip}>
                      <Feather name="clock" size={11} color={colors.outline} />
                      <Text style={s.metaText}>{ride.startTime}</Text>
                    </View>
                    <View style={s.metaChip}>
                      <Feather name="activity" size={11} color={colors.outline} />
                      <Text style={s.metaText}>{ride.durationHours}H</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={s.deleteRow} onPress={() => handleDelete(ride.id, ride.label)} activeOpacity={0.7}>
                    <Feather name="trash-2" size={14} color={colors.outline} />
                    <Text style={s.deleteText}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </FadeInView>
            ))}

            <PressableScale style={s.addBtn} onPress={() => router.push('/recurring-new')} haptic>
              <Feather name="plus" size={16} color={colors.primary} />
              <Text style={s.addBtnText}>ADD REPEAT RIDE</Text>
            </PressableScale>
          </>
        )}
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
  content: { paddingHorizontal: 24, paddingTop: 28, gap: 12 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface, letterSpacing: -0.3 },
  emptySub: { fontFamily: typography.fontFamily.body, fontSize: typography.size.base, color: c.outline, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 24 },
  emptyBtn: { marginTop: 32, backgroundColor: c.lime, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 2 },
  emptyBtnText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.base, color: c.limeText, letterSpacing: 1 },

  card: { backgroundColor: c.surfaceCard, borderRadius: 2, padding: 20, gap: 14 },
  cardInactive: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 2 },
  cardLabel: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.lg, color: c.onSurface, letterSpacing: -0.3 },
  cardLocation: { fontFamily: typography.fontFamily.body, fontSize: typography.size.base, color: c.outline },
  cardMeta: { flexDirection: 'row', gap: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 0.5 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.outlineAlpha15 },
  deleteText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.xs, color: c.outline, letterSpacing: 1 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: c.outlineAlpha25, borderRadius: 2, paddingVertical: 18, marginTop: 4 },
  addBtnText: { fontFamily: typography.fontFamily.headline, fontSize: typography.size.base, color: c.primary, letterSpacing: 1 },
});
