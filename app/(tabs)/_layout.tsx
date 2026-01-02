import CustomTabBar from '@/components/navigation/CustomTabBar';
import { Colors } from '@/constants/Colors';
import { Tabs } from 'expo-router';
import { Home, LayoutGrid, Mic } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

// Keep the VoiceTabButton for reference (used internally by CustomTabBar now)
const VoiceTabButton = ({ focused }: { focused: boolean }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focused ? 1.15 : scale.value }],
  }));

  return (
    <Animated.View style={[styles.centralIconContainer, animatedStyle]}>
      <Mic size={26} color="#FFF" />
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />
        }}
      />

      <Tabs.Screen
        name="voice-pivot"
        options={{
          title: 'Voz',
          tabBarIcon: ({ focused }) => <VoiceTabButton focused={focused} />,
          tabBarLabel: () => null
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centralIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 32 : 24,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: Colors.background.primary,
  },
});
