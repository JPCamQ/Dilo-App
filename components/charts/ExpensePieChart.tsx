// Dilo App - Expense Pie Chart Component
// Custom pie chart using react-native-svg directly (no chart-kit)

import CategoryIcon from '@/components/ui/CategoryIcon';
import { Colors } from '@/constants/Colors';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Category, Transaction } from '@/types';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

interface ExpensePieChartProps {
    transactions: Transaction[];
    categories: Category[];
}

interface CategoryData {
    id: string;
    name: string;
    icon: string;
    amount: number;
    color: string;
    percentage: number;
}

// Vibrant colors for chart segments
const CHART_COLORS = [
    '#0EA5E9', // Cyan Premium
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#F43F5E', // Rose
    '#F59E0B', // Amber
    '#10B981', // Emerald (Mature)
    '#EC4899', // Pink
    '#14B8A6', // Teal
];

// Function to create pie chart path
const createPieSlice = (
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
): string => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
        'M', cx, cy,
        'L', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'Z'
    ].join(' ');
};

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: cx + (radius * Math.cos(angleInRadians)),
        y: cy + (radius * Math.sin(angleInRadians))
    };
};

export default function ExpensePieChart({ transactions, categories }: ExpensePieChartProps) {
    // Calculate expenses by category
    const chartData = useMemo<CategoryData[]>(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        if (expenses.length === 0) return [];

        const totals: Record<string, number> = {};
        expenses.forEach(t => {
            const catId = t.categoryId || 'other';
            totals[catId] = (totals[catId] || 0) + t.amountUsd;
        });

        const totalExpenses = Object.values(totals).reduce((a, b) => a + b, 0);

        return Object.entries(totals)
            .map(([id, amount], index) => {
                const category = categories.find(c => c.id === id) ||
                    DEFAULT_CATEGORIES.find(c => c.id === id);
                return {
                    id,
                    name: category?.name || 'Otros',
                    icon: category?.icon || 'circle',
                    amount,
                    color: CHART_COLORS[index % CHART_COLORS.length],
                    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
                };
            })
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);
    }, [transactions, categories]);

    if (chartData.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Sin gastos para mostrar</Text>
            </View>
        );
    }

    const totalExpenses = chartData.reduce((sum, c) => sum + c.amount, 0);
    const size = 160;
    const radius = 70;
    const innerRadius = 45;
    const center = size / 2;

    // Calculate pie slices
    let currentAngle = 0;
    const slices = chartData.map(item => {
        const angle = (item.percentage / 100) * 360;
        const slice = {
            ...item,
            startAngle: currentAngle,
            endAngle: currentAngle + angle,
        };
        currentAngle += angle;
        return slice;
    });

    return (
        <View style={styles.container}>
            {/* Donut Chart */}
            <View style={styles.chartContainer}>
                <Svg width={size} height={size}>
                    <G>
                        {slices.map((slice, index) => (
                            <Path
                                key={slice.id}
                                d={createPieSlice(center, center, radius, slice.startAngle, slice.endAngle)}
                                fill={slice.color}
                            />
                        ))}
                        {/* Inner circle for donut effect */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={innerRadius}
                            fill={Colors.background.secondary}
                        />
                    </G>
                </Svg>

                {/* Center total */}
                <View style={styles.centerLabel}>
                    <Text style={styles.centerValue}>${totalExpenses.toFixed(0)}</Text>
                    <Text style={styles.centerText}>Total</Text>
                </View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {chartData.map((item) => (
                    <View key={item.id} style={styles.legendItem}>
                        <View style={styles.legendLeft}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <CategoryIcon iconName={item.icon} size={16} color={item.color} />
                            <Text style={styles.legendName} numberOfLines={1}>{item.name}</Text>
                        </View>
                        <View style={styles.legendRight}>
                            <Text style={styles.legendAmount}>${item.amount.toFixed(0)}</Text>
                            <Text style={styles.legendPercent}>{item.percentage.toFixed(0)}%</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 160,
    },
    centerLabel: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerValue: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    centerText: {
        fontSize: 11,
        color: Colors.text.muted,
    },
    legend: {
        marginTop: 16,
        gap: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    legendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendName: {
        fontSize: 14,
        color: Colors.text.primary,
        flex: 1,
    },
    legendRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    legendAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        width: 60,
        textAlign: 'right',
    },
    legendPercent: {
        fontSize: 12,
        color: Colors.text.muted,
        width: 35,
        textAlign: 'right',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: Colors.background.secondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border.default,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.muted,
    },
});
