import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../features/auth/authStore';
import { LoginScreen } from '../features/auth/LoginScreen';
import { HomeScreen } from '../features/loyalty/HomeScreen';
import { RewardsScreen } from '../features/loyalty/RewardsScreen';

export type RootStackParamList = {
  Home: undefined;
  Rewards: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  if (!hydrated) {
    return null;
  }

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{ title: 'Rewards', headerShown: true }}
      />
    </Stack.Navigator>
  );
}
