import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card, ProgressRing } from '../../src/components/ui';
import { useNutritionStore } from '../../src/stores/nutritionStore';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function NutritionScreen() {
    const router = useRouter();
    const { weeklyPlan, dailyGoals, waterIntake, selectedDay, setSelectedDay, addWater } =
        useNutritionStore();

    const today = weeklyPlan[selectedDay];
    if (!today) return null;

    const calPercent = today.totalCalories / dailyGoals.calories;
    const proteinPercent = today.totalProtein / dailyGoals.protein;
    const carbsPercent = today.totalCarbs / dailyGoals.carbs;
    const fatPercent = today.totalFat / dailyGoals.fat;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.topRow}>
                    <View>
                        <Text style={styles.title}>Nutrition</Text>
                        <Text style={styles.subtitle}>Weekly meal plan</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/nutrition/log-meal')}>
                        <Ionicons name="add" size={20} color={colors.primary} />
                        <Text style={styles.addBtnText}>Log Meal</Text>
                    </TouchableOpacity>
                </View>

                {/* Day Selector */}
                <View style={styles.dayRow}>
                    {dayLabels.map((label, i) => (
                        <TouchableOpacity
                            key={label}
                            onPress={() => setSelectedDay(i)}
                            style={[styles.dayPill, selectedDay === i && styles.dayPillActive]}
                        >
                            <Text style={[styles.dayText, selectedDay === i && styles.dayTextActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Macro Overview */}
                <Card variant="glow" style={styles.macroCard}>
                    <View style={styles.macroRings}>
                        <View style={styles.macroRingItem}>
                            <ProgressRing size={70} strokeWidth={6} progress={calPercent} color={colors.primary}>
                                <Text style={styles.macroRingValue}>{Math.round(calPercent * 100)}%</Text>
                            </ProgressRing>
                            <Text style={styles.macroRingLabel}>Calories</Text>
                            <Text style={styles.macroRingDetail}>{today.totalCalories}/{dailyGoals.calories}</Text>
                        </View>
                        <View style={styles.macroRingItem}>
                            <ProgressRing size={70} strokeWidth={6} progress={proteinPercent} color={colors.tertiary}>
                                <Text style={styles.macroRingValue}>{today.totalProtein}g</Text>
                            </ProgressRing>
                            <Text style={styles.macroRingLabel}>Protein</Text>
                            <Text style={styles.macroRingDetail}>of {dailyGoals.protein}g</Text>
                        </View>
                        <View style={styles.macroRingItem}>
                            <ProgressRing size={70} strokeWidth={6} progress={carbsPercent} color={colors.secondary}>
                                <Text style={styles.macroRingValue}>{today.totalCarbs}g</Text>
                            </ProgressRing>
                            <Text style={styles.macroRingLabel}>Carbs</Text>
                            <Text style={styles.macroRingDetail}>of {dailyGoals.carbs}g</Text>
                        </View>
                        <View style={styles.macroRingItem}>
                            <ProgressRing size={70} strokeWidth={6} progress={fatPercent} color={colors.warning}>
                                <Text style={styles.macroRingValue}>{today.totalFat}g</Text>
                            </ProgressRing>
                            <Text style={styles.macroRingLabel}>Fat</Text>
                            <Text style={styles.macroRingDetail}>of {dailyGoals.fat}g</Text>
                        </View>
                    </View>
                </Card>

                {/* Water Tracking */}
                <Card style={styles.waterCard}>
                    <View style={styles.waterHeader}>
                        <View style={styles.waterLeft}>
                            <Ionicons name="water" size={22} color={colors.info} />
                            <View>
                                <Text style={styles.waterTitle}>Hydration</Text>
                                <Text style={styles.waterSub}>{waterIntake}/{dailyGoals.water} glasses</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={addWater} style={styles.waterAddBtn}>
                            <Ionicons name="add" size={20} color={colors.textInverse} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.waterDots}>
                        {Array.from({ length: dailyGoals.water }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.waterDot,
                                    i < waterIntake ? styles.waterDotFull : styles.waterDotEmpty,
                                ]}
                            />
                        ))}
                    </View>
                </Card>

                {/* Meals */}
                <Text style={styles.sectionTitle}>{today.day}'s Meals</Text>
                {today.meals.map((meal) => (
                    <Card key={meal.id} style={styles.mealCard}>
                        <View style={styles.mealHeader}>
                            <View>
                                <Text style={styles.mealName}>{meal.name}</Text>
                                <Text style={styles.mealTime}>{meal.time}</Text>
                            </View>
                            <View style={styles.mealCal}>
                                <Text style={styles.mealCalValue}>{meal.calories}</Text>
                                <Text style={styles.mealCalUnit}>cal</Text>
                            </View>
                        </View>
                        <View style={styles.mealItems}>
                            {meal.items.map((item, idx) => (
                                <View key={idx} style={styles.mealItemRow}>
                                    <View style={styles.mealItemDot} />
                                    <Text style={styles.mealItemText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.mealMacros}>
                            <View style={styles.mealMacroItem}>
                                <View style={[styles.mealMacroBar, { backgroundColor: colors.tertiary, width: `${(meal.protein / 50) * 100}%` as any }]} />
                                <Text style={styles.mealMacroText}>P: {meal.protein}g</Text>
                            </View>
                            <View style={styles.mealMacroItem}>
                                <View style={[styles.mealMacroBar, { backgroundColor: colors.secondary, width: `${(meal.carbs / 70) * 100}%` as any }]} />
                                <Text style={styles.mealMacroText}>C: {meal.carbs}g</Text>
                            </View>
                            <View style={styles.mealMacroItem}>
                                <View style={[styles.mealMacroBar, { backgroundColor: colors.warning, width: `${(meal.fat / 30) * 100}%` as any }]} />
                                <Text style={styles.mealMacroText}>F: {meal.fat}g</Text>
                            </View>
                        </View>
                    </Card>
                ))}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
    title: { ...typography.display, color: colors.textPrimary },
    subtitle: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.primary + '40', marginTop: spacing.sm },
    addBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    dayRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xxl },
    dayPill: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
    },
    dayPillActive: {
        backgroundColor: colors.primary,
    },
    dayText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    dayTextActive: { color: colors.textInverse },
    macroCard: { marginBottom: spacing.lg },
    macroRings: { flexDirection: 'row', justifyContent: 'space-between' },
    macroRingItem: { alignItems: 'center', gap: spacing.xs },
    macroRingValue: { ...typography.caption, color: colors.textPrimary, fontWeight: '700', fontSize: 10 },
    macroRingLabel: { ...typography.caption, color: colors.textSecondary },
    macroRingDetail: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
    waterCard: { marginBottom: spacing.xxl },
    waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    waterLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    waterTitle: { ...typography.bodyBold, color: colors.textPrimary },
    waterSub: { ...typography.caption, color: colors.textSecondary },
    waterAddBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.info,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waterDots: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    waterDot: { width: 28, height: 28, borderRadius: 14 },
    waterDotFull: { backgroundColor: colors.info + '40', borderWidth: 2, borderColor: colors.info },
    waterDotEmpty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    mealCard: { marginBottom: spacing.md },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    mealName: { ...typography.bodyBold, color: colors.textPrimary },
    mealTime: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    mealCal: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    mealCalValue: { ...typography.h3, color: colors.primary },
    mealCalUnit: { ...typography.caption, color: colors.textSecondary },
    mealItems: { marginBottom: spacing.md },
    mealItemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    mealItemDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary },
    mealItemText: { ...typography.subhead, color: colors.textSecondary },
    mealMacros: { flexDirection: 'row', gap: spacing.md },
    mealMacroItem: { flex: 1 },
    mealMacroBar: { height: 3, borderRadius: 2, marginBottom: spacing.xs },
    mealMacroText: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
});
