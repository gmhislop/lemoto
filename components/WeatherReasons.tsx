import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WeatherReason } from '../types/weather';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const ICONS: Record<WeatherReason['factor'], keyof typeof Feather.glyphMap> = {
  rain: 'cloud-rain',
  wind: 'wind',
  temperature: 'thermometer',
};

const SEVERITY_COLORS: Record<WeatherReason['severity'], string> = {
  ok: colors.green,
  warning: colors.orange,
  danger: colors.red,
};

interface Props {
  reasons: WeatherReason[];
}

export function WeatherReasons({ reasons }: Props) {
  if (reasons.length === 0) {
    return <Text style={styles.allGood}>Alle factoren zijn gunstig.</Text>;
  }

  return (
    <View style={styles.list}>
      {reasons.map((r, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: SEVERITY_COLORS[r.severity] }]} />
          <Feather name={ICONS[r.factor]} size={14} color={colors.textMuted} />
          <Text style={styles.label}>{r.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing['2'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  allGood: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
});
