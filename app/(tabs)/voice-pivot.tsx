import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppStore } from '@/stores/useAppStore';

/**
 * Pivot screen that automatically triggers the voice listening modal on the dashboard
 * and then redirects back to home or stays active.
 */
export default function VoicePivotScreen() {
    const { setVoiceModalOpen } = useAppStore();

    useEffect(() => {
        // Trigger global state to open modal
        setVoiceModalOpen(true);
        // Navigate to Home/Dashboard
        router.navigate('/');
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
        </View>
    );
}
