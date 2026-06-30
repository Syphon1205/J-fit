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
import { safeBack } from '../../src/utils/navigation';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { workouts, startWorkout } = useWorkoutStore();

    const workout = workouts.find((w) => w.id === id);
    if (!workout) return null;

    const preferredExercise = workout.exercises.some((exercise) => exercise.name.toLowerCase().includes('push'))
        ? 'pushups'
        : workout.exercises.some((exercise) => exercise.name.toLowerCase().includes('squat'))
            ? 'squats'
            : workout.exercises.some((exercise) => exercise.name.toLowerCase().includes('lunge'))
                ? 'lunges'
                : workout.exercises.some((exercise) => exercise.name.toLowerCase().includes('plank'))
                    ? 'plank'
                    : 'burpees';

    const handleStart = () => {
        startWorkout(workout);
        router.push('/workout/timer');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/workouts')} style={styles.backBtn}>
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

                <Card style={styles.videoCard}>
                    <View style={styles.videoCardHeader}>
                        <View>
                            <Text style={styles.videoCardTitle}>Trainer videos</Text>
                            <Text style={styles.videoCardSub}>Watch guided movement videos for this workout.</Text>
                        </View>
                        <View style={styles.videoPill}>
                            <Ionicons name="videocam" size={14} color={colors.primary} />
                            <Text style={styles.videoPillText}>New</Text>
                        </View>
                    </View>
                    <Button
                        title="Open video library"
                        onPress={() => router.push('/workout/trainer-videos')}
                        variant="secondary"
                        size="md"
                    />
                </Card>

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

                <View style={{ height: 190 }} />
            </ScrollView>

            {/* Fixed Start Button */}
            <View style={styles.startBar}>
                <Button
                    title="Record & Score"
                    onPress={() => router.push(`/workout/record?exercise=${preferredExercise}`)}
                    variant="secondary"
                    size="lg"
                    style={{ flex: 1 }}
                />
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
    content: { paddingHorizontal: spacing.xl, paddingBottom: 210 },
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
    heroName: { color: colors.textPrimary, textAlign: 'center', fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5 },
    heroMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    heroMetaText: { ...typography.subhead, color: colors.textSecondary },
    heroDivider: { width: 1, height: 16, backgroundColor: colors.border },
    videoCard: { marginBottom: spacing.xl },
    videoCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
    videoCardTitle: { ...typography.bodyBold, color: colors.textPrimary },
    videoCardSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2, maxWidth: 240 },
    videoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primaryGlow,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
    },
    videoPillText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
    sectionTitle: { color: colors.textPrimary, marginBottom: spacing.md, fontSize: 24, lineHeight: 30, fontWeight: '800' },
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
    exerciseName: { color: colors.textPrimary, fontWeight: '700', fontSize: 18, lineHeight: 23 },
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
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        paddingBottom: spacing.xxxl,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});
