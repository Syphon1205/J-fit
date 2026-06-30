import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useThemeColors } from '../hooks/useThemeColors';
import { useNutritionStore } from '../stores/nutritionStore';

function MacroRing({ label, value, progress, color }: { label: string; value: string; progress: number; color: string }) {
    const size = 116;
    const stroke = 12;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    return (
        <View style={ringStyles.item}>
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                    <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={stroke} fill="none" />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={stroke}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, progress)))}
                        rotation="-90"
                        originX={size / 2}
                        originY={size / 2}
                    />
                </Svg>
                <Text style={ringStyles.value}>{value}</Text>
            </View>
            <Text style={ringStyles.label}>{label}</Text>
        </View>
    );
}

export default function Nutrition() {
    const { colors } = useThemeColors();
    const { weeklyPlan, dailyGoals, waterIntake, selectedDay, setSelectedDay, addWater } = useNutritionStore();
    const today = weeklyPlan[selectedDay] ?? weeklyPlan[0];
    const styles = makeStyles(colors);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.kicker}>Fuel System</Text>
                        <Text style={styles.title}>Nutrition</Text>
                        <Text style={styles.subtitle}>Nutrition logging is parked while the next version gets rebuilt.</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardTop}>
                        <View>
                            <Text style={styles.kicker}>Macro command center</Text>
                            <Text style={styles.cardTitle}>{today.day}</Text>
                        </View>
                        <Ionicons name="nutrition-outline" size={30} color={colors.secondary} />
                    </View>
                    <View style={styles.rings}>
                        <MacroRing label="Calories" value={`${Math.round((today.totalCalories / dailyGoals.calories) * 100)}%`} progress={today.totalCalories / dailyGoals.calories} color={colors.primary} />
                        <MacroRing label="Protein" value={`${today.totalProtein}g`} progress={today.totalProtein / dailyGoals.protein} color={colors.secondary} />
                        <MacroRing label="Carbs" value={`${today.totalCarbs}g`} progress={today.totalCarbs / dailyGoals.carbs} color={colors.chart4} />
                        <MacroRing label="Fat" value={`${today.totalFat}g`} progress={today.totalFat / dailyGoals.fat} color={colors.tertiary} />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardTop}>
                        <View>
                            <Text style={styles.kicker}>Hydration load</Text>
                            <Text style={styles.cardTitle}>{waterIntake}/{dailyGoals.water}</Text>
                        </View>
                        <TouchableOpacity style={styles.plus} onPress={addWater}>
                            <Ionicons name="add" size={22} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.waterGrid}>
                        {Array.from({ length: dailyGoals.water }).map((_, index) => (
                            <TouchableOpacity key={index} onPress={addWater} style={[styles.waterCell, index < waterIntake && styles.waterCellOn]} />
                        ))}
                    </View>
                </View>

                <View style={styles.dayRow}>
                    {weeklyPlan.map((day, index) => (
                        <TouchableOpacity key={day.day} onPress={() => setSelectedDay(index)} style={[styles.dayChip, selectedDay === index && styles.dayChipOn]}>
                            <Text style={[styles.dayText, selectedDay === index && styles.dayTextOn]}>{day.day.slice(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {(today.meals.length ? today.meals : [{ id: 'empty', name: 'No meals logged', time: 'Nutrition rebuild in progress', protein: 0, items: ['Manual macro tools are paused'] }]).map((meal) => (
                    <View key={meal.id} style={styles.mealCard}>
                        <Text style={styles.mealTitle}>{meal.name}</Text>
                        <Text style={styles.mealMeta}>{meal.time} · {meal.items.join(', ')}</Text>
                        <Text style={styles.protein}>{meal.protein}g protein</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const ringStyles = StyleSheet.create({
    item: { width: '50%', alignItems: 'center', gap: 8, marginTop: 14 },
    value: { color: '#1E293B', fontSize: 19, fontWeight: '900' },
    label: { color: '#64748B', fontSize: 13, fontWeight: '800' },
});

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 18, paddingBottom: 118, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingTop: 12 },
    kicker: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    title: { color: colors.textPrimary, fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -1.4 },
    subtitle: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, fontWeight: '600', marginTop: 6 },
    scanButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 18, minHeight: 48 },
    scanText: { color: '#fff', fontSize: 15, fontWeight: '900' },
    card: { backgroundColor: colors.surface, borderRadius: 32, borderWidth: 1, borderColor: colors.border, padding: 18 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -0.6, marginTop: 5 },
    rings: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    waterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 18 },
    waterCell: { width: '22.5%', height: 34, borderRadius: 999, backgroundColor: colors.surfaceLight },
    waterCellOn: { backgroundColor: colors.primary },
    dayRow: { flexDirection: 'row', gap: 8 },
    dayChip: { flex: 1, alignItems: 'center', borderRadius: 999, paddingVertical: 10, backgroundColor: colors.surface },
    dayChipOn: { backgroundColor: colors.textPrimary },
    dayText: { color: colors.textSecondary, fontSize: 12, fontWeight: '900' },
    dayTextOn: { color: colors.textInverse },
    mealCard: { backgroundColor: colors.surface, borderRadius: 26, borderWidth: 1, borderColor: colors.border, padding: 16 },
    mealTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900' },
    mealMeta: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 6 },
    protein: { color: colors.secondary, fontSize: 14, fontWeight: '900', marginTop: 10 },
});
