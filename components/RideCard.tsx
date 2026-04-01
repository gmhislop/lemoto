import { StyleSheet, Text, View } from 'react-native';
import { Ride } from '../types/ride';
import { TrafficLight } from './TrafficLight';
import { PressableScale } from './PressableScale';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { formatDate } from '../lib/date-utils';

interface Props {
  ride: Ride;
  onPress: () => void;
}

export function RideCard({ ride, onPress }: Props) {
  return (
    <PressableScale style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={1}>
          {ride.label || 'Naamloze rit'}
        </Text>
        {ride.status ? (
          <TrafficLight status={ride.status} size="sm" />
        ) : (
          <View style={styles.pending} />
        )}
      </View>
      <Text style={styles.datetime}>
        {formatDate(ride.date)} · {ride.startTime} · {ride.durationHours}u
      </Text>
      <Text style={styles.location} numberOfLines={1}>
        {ride.location.label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.md,
    padding: spacing['4'],
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['1'],
  },
  label: {
    flex: 1,
    marginRight: spacing['2'],
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
  pending: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundMuted,
  },
  datetime: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing['1'],
  },
  location: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
});
