import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background.primary },
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="lock" />
        </Stack>
    );
}

