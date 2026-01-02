// Dilo App - Premium Header (Clean Design)
// Cabecera limpia: Logo + Dilo a la izquierda, menú a la derecha

import { Colors } from '@/constants/Colors';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PremiumHeaderProps {
    onMenuPress: () => void;
    title?: string;
}

export default function PremiumHeader({ onMenuPress, title }: PremiumHeaderProps) {
    return (
        <View style={styles.container}>
            {/* Logo + Brand on Left */}
            <View style={styles.leftSection}>
                {title ? (
                    <Text style={styles.title}>{title}</Text>
                ) : (
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('@/assets/images/icon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.brandName}>Dilo</Text>
                    </View>
                )}
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Menu Button on Right */}
            <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} activeOpacity={0.7}>
                <View style={styles.menuLines}>
                    <View style={styles.menuLine} />
                    <View style={[styles.menuLine, styles.menuLineShort]} />
                    <View style={styles.menuLine} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: Colors.background.primary,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoImage: {
        width: 42,
        height: 42,
        borderRadius: 12,
    },
    brandName: {
        fontSize: 26,
        fontWeight: '700',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    spacer: {
        flex: 1,
    },
    menuButton: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: Colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    menuLines: {
        width: 18,
        height: 12,
        justifyContent: 'space-between',
    },
    menuLine: {
        width: 18,
        height: 2,
        backgroundColor: Colors.text.primary,
        borderRadius: 1,
    },
    menuLineShort: {
        width: 12,
    },
});
