import { View, Text } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing['5'] }}>
      <Text style={{ fontFamily: typography.fontFamily.mono, fontSize: typography.size.lg, color: colors.textPrimary }}>
        Instellingen
      </Text>
    </View>
  );
}
