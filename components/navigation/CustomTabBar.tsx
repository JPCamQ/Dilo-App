// Custom Tab Bar with Smooth Curved Notch - Premium Design
import { Colors } from '@/constants/Colors';
import { useAppStore } from '@/stores/useAppStore';
import { Home, LayoutGrid, Mic } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface CustomTabBarProps {
    state: any;
    descriptors: any;
    navigation: any;
}

// Design constants - adjusted for smoother look
const TAB_HEIGHT = Platform.OS === 'ios' ? 55 : 52;
const BUTTON_SIZE = 56;
const BUTTON_BORDER = 3;
const CURVE_DEPTH = 32; // How deep the curve goes
const CURVE_WIDTH = 70; // Width of the curved notch area
const SCREEN_WIDTH = Dimensions.get('window').width;

// Animated Voice Button with Subtle Pulse Effect
const VoiceButton = ({ onPress }: { onPress: () => void }) => {
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.2);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.04, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 1600 }),
                withTiming(0.2, { duration: 1600 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.voiceButtonWrapper}>
            <Animated.View style={[styles.glowRing, glowStyle]} />
            <Animated.View style={[styles.voiceButton, animatedStyle]}>
                <Mic size={24} color="#FFF" strokeWidth={2.5} />
            </Animated.View>
        </TouchableOpacity>
    );
};

// Generate smooth curved notch path using cubic bezier curves
const generateSmoothNotchPath = (width: number, height: number): string => {
    const centerX = width / 2;
    const curveStartX = centerX - CURVE_WIDTH;
    const curveEndX = centerX + CURVE_WIDTH;
    const topY = 0;
    const barTopY = CURVE_DEPTH;
    
    // Control points for smooth bezier curves
    const cp1X = curveStartX + CURVE_WIDTH * 0.5;
    const cp2X = centerX - CURVE_WIDTH * 0.3;
    const cp3X = centerX + CURVE_WIDTH * 0.3;
    const cp4X = curveEndX - CURVE_WIDTH * 0.5;

    return `
        M 0 ${barTopY}
        L 0 ${height}
        L ${width} ${height}
        L ${width} ${barTopY}
        L ${curveEndX} ${barTopY}
        C ${cp4X} ${barTopY}, ${cp3X} ${topY}, ${centerX} ${topY}
        C ${cp2X} ${topY}, ${cp1X} ${barTopY}, ${curveStartX} ${barTopY}
        L 0 ${barTopY}
        Z
    `;
};

// Generate border path for the curve
const generateBorderPath = (width: number): string => {
    const centerX = width / 2;
    const curveStartX = centerX - CURVE_WIDTH;
    const curveEndX = centerX + CURVE_WIDTH;
    const topY = 0;
    const barTopY = CURVE_DEPTH;
    
    const cp1X = curveStartX + CURVE_WIDTH * 0.5;
    const cp2X = centerX - CURVE_WIDTH * 0.3;
    const cp3X = centerX + CURVE_WIDTH * 0.3;
    const cp4X = curveEndX - CURVE_WIDTH * 0.5;

    return `
        M 0 ${barTopY}
        L ${curveStartX} ${barTopY}
        C ${cp1X} ${barTopY}, ${cp2X} ${topY}, ${centerX} ${topY}
        C ${cp3X} ${topY}, ${cp4X} ${barTopY}, ${curveEndX} ${barTopY}
        L ${width} ${barTopY}
    `;
};

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { setVoiceModalOpen } = useAppStore();
    const [width, setWidth] = useState(SCREEN_WIDTH);

    const routes = state.routes;
    const centerIndex = Math.floor(routes.length / 2);

    const handleVoicePress = () => {
        setVoiceModalOpen(true);
    };

    const totalHeight = TAB_HEIGHT + CURVE_DEPTH;
    const notchPath = generateSmoothNotchPath(width, totalHeight);
    const borderPath = generateBorderPath(width);

    // Position button so it sits nicely in the curve
    const buttonTop = (CURVE_DEPTH - BUTTON_SIZE) / 2 - 2;

    return (
        <View
            style={[styles.container, { paddingBottom: insets.bottom }]}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
            {/* SVG Background with Smooth Curved Notch */}
            <View style={[styles.svgWrapper, { height: totalHeight }]} pointerEvents="none">
                <Svg width={width} height={totalHeight}>
                    <Path d={notchPath} fill={Colors.background.secondary} />
                    <Path
                        d={borderPath}
                        stroke={Colors.premium.glassBorder}
                        strokeWidth={0.5}
                        fill="none"
                    />
                </Svg>
            </View>

            {/* Floating Voice Button */}
            <View style={[styles.floatingButtonContainer, { top: buttonTop }]}>
                <VoiceButton onPress={handleVoicePress} />
            </View>

            {/* Tab Items */}
            <View style={[styles.tabsRow, { marginTop: CURVE_DEPTH }]}>
                {routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;
                    const isCenter = index === centerIndex;

                    if (isCenter) {
                        return <View key={route.key} style={styles.centerSpace} />;
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const Icon = index === 0 ? Home : LayoutGrid;
                    const label = index === 0 ? 'Inicio' : 'Más';

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
                        >
                            <Icon
                                size={22}
                                color={isFocused ? Colors.accent.primary : Colors.text.muted}
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    { color: isFocused ? Colors.accent.primary : Colors.text.muted },
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    svgWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    floatingButtonContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    tabsRow: {
        flexDirection: 'row',
        height: TAB_HEIGHT,
        alignItems: 'center',
        zIndex: 20,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    centerSpace: {
        width: CURVE_WIDTH * 2 + 20,
    },
    voiceButtonWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowRing: {
        position: 'absolute',
        width: BUTTON_SIZE + 16,
        height: BUTTON_SIZE + 16,
        borderRadius: (BUTTON_SIZE + 16) / 2,
        backgroundColor: Colors.accent.primary,
    },
    voiceButton: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: Colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.accent.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: BUTTON_BORDER,
        borderColor: Colors.background.primary,
    },
});
