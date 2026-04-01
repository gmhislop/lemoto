import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props extends TouchableOpacityProps {
  scale?: number;
  haptic?: boolean;
}

export function PressableScale({ scale: scaleTo = 0.96, haptic = false, style, children, onPress, ...props }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress(e: any) {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  }

  return (
    <AnimatedTouchable
      activeOpacity={1}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 14, stiffness: 320, mass: 0.7 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 11, stiffness: 260, mass: 0.7 });
      }}
      onPress={handlePress}
      style={[style, animStyle]}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
}
