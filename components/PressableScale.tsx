import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Props extends TouchableOpacityProps {
  scale?: number;
}

export function PressableScale({ scale: scaleTo = 0.96, style, children, ...props }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={1}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300, mass: 0.8 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 250, mass: 0.8 });
      }}
      style={[style, animStyle]}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
}
