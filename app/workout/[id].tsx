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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Button } from '../../src/components/ui';
import { useWorkoutStore } from '../../src/stores/workoutStore';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { workouts, startWorkout } = useWorkoutStore();

    const workout = workouts.find((w) => w.id === id);
    if (!workout) return null;

    const handleStart = () => {
        startWorkout(workout);
        router.push('/workout/timer');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn}>
                    <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Workout Hero */}
                <LinearGradient
                    colors={[workout.color + '30', colors.surface]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={[styles.heroIcon, { backgroundColor: workout.color + '30' }]}>
                        <Ionicons name={(workout.icon || 'barbell') as any} size={40} color={workout.color} />
                    </View>
                    <Text style={styles.heroName}>{workout.name}</Text>
                    <View style={styles.heroMeta}>
                        <View style={styles.heroMetaItem}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.heroMetaText}>{workout.duration} min</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroMetaItem}>
                            <Ionicons name="flame-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.heroMetaText}>{workout.calories} cal</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroMetaItem}>
                            <Ionicons name="speedometer-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.heroMetaText, { textTransform: 'capitalize' }]}>{workout.difficulty}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Exercises */}
                <Text style={styles.sectionTitle}>Exercises ({workout.exercises.length})</Text>
                {workout.exercises.map((ex, i) => (
                    <Card key={ex.id} style={styles.exerciseCard}>
                        <View style={styles.exerciseRow}>
                            <View style={styles.exerciseIndex}>
                                <Text style={styles.exerciseIndexText}>{i + 1}</Text>
                            </View>
                            <View style={styles.exerciseInfo}>
                                <Text style={styles.exerciseName}>{ex.name}</Text>
                                <View style={styles.exerciseMeta}>
                                    <Text style={styles.exerciseDetail}>
                                        {ex.sets} sets × {ex.reps}
                                    </Text>
                                    {ex.weight && (
                                        <Text style={styles.exerciseWeight}>{ex.weight}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.restBadge}>
                                <Ionicons name="hourglass-outline" size={12} color={colors.textTertiary} />
                                <Text style={styles.restText}>{ex.restTime}s</Text>
                            </View>
                        </View>
                    </Card>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fixed Start Button */}
            <View style={styles.startBar}>
                <Button title="Start Workout" onPress={handleStart} size="lg" style={{ flex: 1 }} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: { paddingHorizontal: spacing.xl },
    hero: {
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    heroIcon: {
        width: 72,
        height: 72,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    heroName: { ...typography.h1, color: colors.textPrimary, textAlign: 'center' },
    heroMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    heroMetaText: { ...typography.subhead, color: colors.textSecondary },
    heroDivider: { width: 1, height: 16, backgroundColor: colors.border },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    exerciseCard: { marginBottom: spacing.sm },
    exerciseRow: { flexDirection: 'row', alignItems: 'center' },
    exerciseIndex: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    exerciseIndexText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    exerciseInfo: { flex: 1 },
    exerciseName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
    exerciseMeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
    exerciseDetail: { ...typography.caption, color: colors.textSecondary },
    exerciseWeight: { ...typography.caption, color: colors.primary, fontWeight: '600' },
    restBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    restText: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
    startBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        paddingBottom: spacing.xxxl,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});
