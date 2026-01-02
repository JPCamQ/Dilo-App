// Dilo App - Root Layout
// Configuración principal con dark mode y global styles

import LockScreen from '@/components/auth/LockScreen';
import { configureGoogleSignIn, uploadBackup } from '@/services/googleAuthService';
import { useAppStore } from '@/stores/useAppStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Custom dark theme for Dilo App
const DiloTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#0EA5E9',
    background: '#020617',
    card: '#0F172A',
    text: '#FFFFFF',
    border: '#334155',
    notification: '#0EA5E9',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { isLocked, setLocked, biometricEnabled } = useAppStore();

  // Initialize Google Sign-In
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Lock logic with Grace Period specifically for system dialogs (Permissions, Share Sheet)
  const backgroundTime = useRef<number>(0);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Just record when we went to background
        backgroundTime.current = Date.now();
      } else if (nextAppState === 'active') {
        // If we come back, check how long we were away
        const timeInBackground = Date.now() - backgroundTime.current;

        // Only lock if we were away for more than 10 seconds (enough for permissions/sharing)
        // AND biometric is enabled
        // AND we actually went to background (time > 0)
        if (biometricEnabled && backgroundTime.current > 0 && timeInBackground > 10000) {
          setLocked(true);
        }

        // Reset
        if (nextAppState === 'active') {
          backgroundTime.current = 0;
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial lock: Always lock on mount if enabled
    if (biometricEnabled) {
      setLocked(true);
    }

    return () => {
      subscription.remove();
    };
  }, [biometricEnabled]);

  // Auto-Sync Logic (Surprise Feature)
  const {
    transactions,
    accounts,
    categories,
    googleUser,
    cloudSyncEnabled,
    setLastCloudBackup
  } = useAppStore();

  useEffect(() => {
    if (!cloudSyncEnabled || !googleUser) return;

    const timer = setTimeout(async () => {
      console.log('Auto-syncing to Google Drive...');
      const result = await uploadBackup({ transactions, accounts, categories });
      if (result.success) {
        setLastCloudBackup(new Date().toISOString());
      }
    }, 3000); // Debounce 3s

    return () => clearTimeout(timer);

  }, [transactions, accounts, categories, cloudSyncEnabled, googleUser]);

  // Login Suggestion (Hybrid Mode) Tracking
  const { firstOpenDate, setFirstOpenDate, incrementAppLaunchCount } = useAppStore();

  useEffect(() => {
    // 1. Set First Open Date if missing
    if (!firstOpenDate) {
      setFirstOpenDate(new Date().toISOString());
    }
    // 2. Increment Launch Count (once per mount)
    incrementAppLaunchCount();
  }, []);
  return (
    <ThemeProvider value={DiloTheme}>
      <StatusBar style="light" />
      {isLocked && biometricEnabled && <LockScreen />}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="categories" options={{ headerShown: false }} />
        <Stack.Screen name="accounts" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="transactions" options={{ headerShown: false }} />
        <Stack.Screen name="voice-keywords" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#FFFFFF',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
