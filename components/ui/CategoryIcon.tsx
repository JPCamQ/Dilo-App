// Dilo App - Category Icon Component
// Renders Lucide icons based on icon name from category

import { Colors } from '@/constants/Colors';
import * as LucideIcons from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CategoryIconProps {
    iconName: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
}

// Map of icon names to Lucide components
const iconComponents: Record<string, any> = {
    'utensils': LucideIcons.Utensils,
    'car': LucideIcons.Car,
    'fuel': LucideIcons.Fuel,
    'smartphone': LucideIcons.Smartphone,
    'home': LucideIcons.Home,
    'briefcase-medical': LucideIcons.BriefcaseMedical,
    'tv': LucideIcons.Tv,
    'user': LucideIcons.User,
    'graduation-cap': LucideIcons.GraduationCap,
    'shopping-cart': LucideIcons.ShoppingCart,
    'briefcase': LucideIcons.Briefcase,
    'store': LucideIcons.Store,
    'laptop': LucideIcons.Laptop,
    'arrow-left-right': LucideIcons.ArrowLeftRight,
    'gift': LucideIcons.Gift,
    'trending-up': LucideIcons.TrendingUp,
    'file-text': LucideIcons.FileText,
    'circle': LucideIcons.Circle,
    'plus': LucideIcons.Plus,
    'wallet': LucideIcons.Wallet,
    'credit-card': LucideIcons.CreditCard,
    'heart': LucideIcons.Heart,
    'star': LucideIcons.Star,
    'tag': LucideIcons.Tag,
    'percent': LucideIcons.Percent,
    'building': LucideIcons.Building,
    'plane': LucideIcons.Plane,
    'music': LucideIcons.Music,
    'book': LucideIcons.Book,
    'coffee': LucideIcons.Coffee,
    'scissors': LucideIcons.Scissors,
    'zap': LucideIcons.Zap,
    'dollar-sign': LucideIcons.DollarSign,
    'banknote': LucideIcons.Banknote,
    'coins': LucideIcons.Coins,
};

export default function CategoryIcon({
    iconName,
    size = 24,
    color = Colors.accent.primary,
    backgroundColor,
}: CategoryIconProps) {
    const IconComponent = iconComponents[iconName] || LucideIcons.Circle;

    if (backgroundColor) {
        return (
            <View style={[
                styles.iconContainer,
                {
                    backgroundColor: `${color}20`,
                    width: size * 2,
                    height: size * 2,
                    borderRadius: size * 0.5,
                }
            ]}>
                <IconComponent size={size} color={color} strokeWidth={2} />
            </View>
        );
    }

    return <IconComponent size={size} color={color} strokeWidth={2} />;
}

// Export icon list for picker
export const AVAILABLE_ICONS = Object.keys(iconComponents);

const styles = StyleSheet.create({
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
