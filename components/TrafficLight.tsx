import { View } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { TrafficLight as TrafficLightStatus } from '../types/ride';

const SIZES = { sm: 12, md: 24, lg: 48 } as const;

interface Props {
  status: TrafficLightStatus;
  size?: keyof typeof SIZES;
}

export function TrafficLight({ status, size = 'md' }: Props) {
  const dim = SIZES[size];
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: radius.full,
        backgroundColor: colors[status],
      }}
    />
  );
}
