import { useEffect, useRef, useState } from 'react';
import { LayoutRectangle, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { typography } from '../theme/typography';

const TABS = [
  { name: 'index',    label: 'HOME',     icon: 'home'        as const },
  { name: 'add-ride', label: 'ADD RIDE', icon: 'plus-circle' as const },
  { name: 'settings', label: 'SETTINGS', icon: 'settings'    as const },
];

const SPRING = { damping: 20, stiffness: 260, mass: 0.7 };

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const layouts = useRef<(LayoutRectangle | null)[]>([null, null, null]);
  const [measured, setMeasured] = useState(false);

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    const layout = layouts.current[state.index];
    if (!layout) return;
    indicatorX.value = withSpring(layout.x, SPRING);
    indicatorW.value = withSpring(layout.width, SPRING);
    indicatorOpacity.value = withTiming(1, { duration: 180 });
  }, [state.index, measured]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
    opacity: indicatorOpacity.value,
  }));

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Animated.View style={[s.indicator, indicatorStyle]} pointerEvents="none" />
      {state.routes.map((route, index) => {
        const tab = TABS[index];
        const active = state.index === index;
        return (
          <TabItem
            key={route.key}
            tab={tab}
            active={active}
            colors={colors}
            onLayout={(layout) => {
              layouts.current[index] = layout;
              if (layouts.current.every(Boolean)) setMeasured(true);
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.dispatch(TabActions.jumpTo(route.name));
            }}
          />
        );
      })}
    </View>
  );
}

function TabItem({
  tab, active, colors, onLayout, onPress,
}: {
  tab: typeof TABS[number];
  active: boolean;
  colors: Colors;
  onLayout: (r: LayoutRectangle) => void;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const iconY = useSharedValue(0);

  const itemStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: iconY.value }] }));

  function handlePress() {
    iconY.value = withSpring(-3, { damping: 10, stiffness: 500, mass: 0.4 }, () => {
      iconY.value = withSpring(0, { damping: 12, stiffness: 300 });
    });
    scale.value = withSpring(0.88, { damping: 12, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 250 });
    });
    onPress();
  }

  return (
    <TouchableOpacity
      style={staticStyles.item}
      onPress={handlePress}
      activeOpacity={1}
      onLayout={(e) => onLayout(e.nativeEvent.layout)}
    >
      <Animated.View style={[staticStyles.itemInner, itemStyle]}>
        <Animated.View style={iconStyle}>
          <Feather name={tab.icon} size={18} color={active ? colors.limeText : colors.onSurface} />
        </Animated.View>
        <Text style={[staticStyles.label, { color: active ? colors.limeText : colors.onSurface }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// Static (non-color) layout styles
const staticStyles = StyleSheet.create({
  item: { flex: 1, zIndex: 1 },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 3,
  },
  label: {
    fontFamily: typography.fontFamily.headline,
    fontSize: 9,
    letterSpacing: 0.8,
  },
});

const makeStyles = (c: Colors) => StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: c.headerBg,
    borderTopWidth: 1,
    borderTopColor: c.surfaceLow,
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 6,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 10,
    height: 46,
    backgroundColor: c.lime,
    borderRadius: 6,
    zIndex: 0,
  },
});
