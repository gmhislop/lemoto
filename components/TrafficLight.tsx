import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { TrafficLight as TrafficLightStatus } from '../types/ride';

const SIZES = { sm: 12, md: 24, lg: 48 } as const;

interface Props {
  status: TrafficLightStatus;
  size?: keyof typeof SIZES;
}

export function TrafficLight({ status, size = 'md' }: Props) {
  const scale = useSharedValue(1);
  const dim = SIZES[size];

  useEffect(() => {
    if (status === 'green' && size !== 'sm') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.14, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [status, size]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: radius.full,
          backgroundColor: colors[status],
        },
        animStyle,
      ]}
    />
  );
}
