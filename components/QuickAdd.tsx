import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Props {
  onSelect: (type: 'tonight' | 'weekend') => void;
}

export function QuickAdd({ onSelect }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => onSelect('tonight')} activeOpacity={0.7}>
          <Text style={styles.label}>Vanavond</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => onSelect('weekend')} activeOpacity={0.7}>
          <Text style={styles.label}>Dit weekend</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.scheduleBtn}
        onPress={() => router.push('/week-schedule')}
        activeOpacity={0.7}
      >
        <Feather name="calendar" size={14} color={colors.textSecondary} />
        <Text style={styles.scheduleLabel}>Weekschema instellen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing['6'],
    gap: spacing['2'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing['3'],
  },
  btn: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing['6'],
    paddingVertical: spacing['3'],
    alignItems: 'center',
  },
  label: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  scheduleBtn: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing['2'],
  },
  scheduleLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
});
