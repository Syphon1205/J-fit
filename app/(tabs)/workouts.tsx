import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useWorkoutStore, Workout } from '../../src/stores/workoutStore';

const categories = ['All', 'Strength', 'Cardio', 'HIIT', 'Yoga', 'Flexibility'];

export default function WorkoutsScreen() {
    const router = useRouter();
    const { workouts, weeklySchedule, workoutLogs } = useWorkoutStore();
    const [activeCategory, setActiveCategory] = useState('All');

    // Stats from logs
    const totalWorkouts = workoutLogs.length;
    const totalCalories = workoutLogs.reduce((sum, l) => sum + l.caloriesBurned, 0);
    // Streak: count consecutive days with a log
    const sortedDates = [...new Set(workoutLogs.map((l) => l.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < sortedDates.length; i++) {
        const expected = new Date();
        expected.setDate(expected.getDate() - i);
        const exp = expected.toISOString().split('T')[0];
        if (sortedDates[i] === exp || (i === 0 && sortedDates[0] <= today)) {
            streak++;
        } else break;
    }

    // Recommended: workouts not done in last 5 logs
    const recentIds = workoutLogs.slice(0, 5).map((l) => l.workoutId);
    const recommended = workouts.filter((w) => !recentIds.includes(w.id)).slice(0, 3);

    const filtered =
        activeCategory === 'All'
            ? workouts
            : workouts.filter(
                (w) => w.category.toLowerCase() === activeCategory.toLowerCase()
            );

    const difficultyColor = (d: string) => {
        switch (d) {
            case 'beginner': return colors.success;
            case 'intermediate': return colors.warning;
            case 'advanced': return colors.error;
            default: return colors.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.title}>Workouts</Text>
                <Text style={styles.subtitle}>Choose your training</Text>

                {/* Stats Strip */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{totalWorkouts}</Text>
                        <Text style={styles.statLabel}>Workouts</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{(totalCalories / 1000).toFixed(1)}k</Text>
                        <Text style={styles.statLabel}>Cal Burned</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.warning }]}>{streak} 🔥</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </Card>
                </View>

                {/* Category Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categories}
                >
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setActiveCategory(cat)}
                            style={[
                                styles.catPill,
                                activeCategory === cat && styles.catPillActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.catText,
                                    activeCategory === cat && styles.catTextActive,
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Weekly Schedule */}
                <Card style={styles.scheduleCard}>
                    <Text style={styles.scheduleTitle}>Weekly Schedule</Text>
                    <View style={styles.scheduleGrid}>
                        {Object.entries(weeklySchedule).map(([day, workout]) => (
                            <View key={day} style={styles.scheduleRow}>
                                <Text style={styles.scheduleDay}>{day}</Text>
                                <View style={styles.scheduleLine} />
                                <Text
                                    style={[
                                        styles.scheduleWorkout,
                                        workout === 'Rest' && { color: colors.textTertiary },
                                    ]}
                                >
                                    {workout}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Workout Cards */}
                <Text style={styles.sectionTitle}>
                    {activeCategory === 'All' ? 'All Programs' : activeCategory}
                </Text>
                {filtered.map((workout) => (
                    <TouchableOpacity
                        key={workout.id}
                        activeOpacity={0.85}
                        onPress={() => router.push(`/workout/${workout.id}`)}
                    >
                        <LinearGradient
                            colors={[workout.color + '18', colors.surface]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.workoutCard}
                        >
                            <View style={styles.workoutHeader}>
                                <View style={[styles.workoutIconWrap, { backgroundColor: workout.color + '25' }]}>
                                    <Ionicons name={(workout.icon || 'barbell') as any} size={24} color={workout.color} />
                                </View>
                                <View
                                    style={[styles.diffBadge, { backgroundColor: difficultyColor(workout.difficulty) + '20' }]}
                                >
                                    <Text style={[styles.diffText, { color: difficultyColor(workout.difficulty) }]}>
                                        {workout.difficulty}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.workoutName}>{workout.name}</Text>
                            <View style={styles.workoutMeta}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                    <Text style={styles.metaText}>{workout.duration} min</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="flame-outline" size={14} color={colors.textSecondary} />
                                    <Text style={styles.metaText}>{workout.calories} cal</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="list-outline" size={14} color={colors.textSecondary} />
                                    <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}

                {/* Recommended Section */}
                {activeCategory === 'All' && recommended.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Recommended For You ⚡</Text>
                        {recommended.map((workout) => (
                            <TouchableOpacity
                                key={`rec-${workout.id}`}
                                activeOpacity={0.85}
                                onPress={() => router.push(`/workout/${workout.id}`)}
                            >
                                <LinearGradient
                                    colors={[workout.color + '30', colors.surface]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.workoutCard, { borderColor: workout.color + '40' }]}
                                >
                                    <View style={styles.workoutHeader}>
                                        <View style={[styles.workoutIconWrap, { backgroundColor: workout.color + '30' }]}>
                                            <Ionicons name={(workout.icon || 'barbell') as any} size={24} color={workout.color} />
                                        </View>
                                        <View style={[styles.diffBadge, { backgroundColor: colors.primary + '18' }]}>
                                            <Text style={[styles.diffText, { color: colors.primary }]}>New for you</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.workoutName}>{workout.name}</Text>
                                    <View style={styles.workoutMeta}>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                            <Text style={styles.metaText}>{workout.duration} min</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="flame-outline" size={14} color={colors.textSecondary} />
                                            <Text style={styles.metaText}>{workout.calories} cal</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="list-outline" size={14} color={colors.textSecondary} />
                                            <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    title: { ...typography.display, color: colors.textPrimary },
    subtitle: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
    // stats strip
    statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
    statValue: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
    statLabel: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    categories: { gap: spacing.sm, marginBottom: spacing.xxl },
    catPill: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    catPillActive: {
        backgroundColor: colors.primaryGlow,
        borderColor: colors.primary,
    },
    catText: { ...typography.caption, color: colors.textSecondary },
    catTextActive: { color: colors.primary, fontWeight: '700' },
    scheduleCard: { marginBottom: spacing.xxl },
    scheduleTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.md },
    scheduleGrid: { gap: spacing.sm },
    scheduleRow: { flexDirection: 'row', alignItems: 'center' },
    scheduleDay: { ...typography.caption, color: colors.textSecondary, width: 36 },
    scheduleLine: { flex: 1, height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
    scheduleWorkout: { ...typography.subhead, color: colors.textPrimary, fontWeight: '500' },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    workoutCard: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    workoutIconWrap: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    diffBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    diffText: { ...typography.caption, fontWeight: '600', textTransform: 'capitalize' },
    workoutName: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
    workoutMeta: { flexDirection: 'row', gap: spacing.lg },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    metaText: { ...typography.caption, color: colors.textSecondary },
});
