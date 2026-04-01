import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const logoY = useSharedValue(-12);
  const logoOpacity = useSharedValue(0);
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoY.value }],
    opacity: logoOpacity.value,
  }));

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    logoY.value = withSpring(0, { damping: 16, stiffness: 200, mass: 0.7 });
  }, []);

  return (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Animated.Text style={[s.logo, logoStyle]}>LEMOTO</Animated.Text>
      <Animated.View style={[s.avatar, logoStyle]}>
        <Animated.Text style={s.avatarText}>M</Animated.Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: c.headerBg,
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.surfaceLow,
  },
  logo: {
    fontFamily: typography.fontFamily.headline,
    fontSize: 22,
    letterSpacing: -0.5,
    color: c.onSurface,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.outlineAlpha15,
  },
  avatarText: {
    fontFamily: typography.fontFamily.headline,
    fontSize: 13,
    color: c.onSurface,
  },
});
