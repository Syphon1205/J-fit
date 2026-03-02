import React from 'react';
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
import { Card, ActivityRings } from '../../src/components/ui';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useNotificationsStore } from '../../src/stores/notificationsStore';
import { useStreak } from '../../src/hooks/useStreak';
import { useChallengesStore } from '../../src/stores/challengesStore';

const { width } = Dimensions.get('window');

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

export default function DashboardScreen() {
    const router = useRouter();
    const { workoutLogs, weeklySchedule, workouts } = useWorkoutStore();
    const { weeklySteps } = useProgressStore();
    const { unreadCount } = useNotificationsStore();

    const todayDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const todaysWorkout = weeklySchedule[todayDay];
    const todayWorkoutData = workouts.find((w) => w.name === todaysWorkout);

    const todaySteps = weeklySteps[weeklySteps.length - 1] || 0;
    const recentLog = workoutLogs[0];
    const { streak, totalWorkouts } = useStreak();
    const { challenges } = useChallengesStore();
    const activeChallenge = challenges.find((c) => !c.completed);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()}</Text>
                        <Text style={styles.name}>Alex 💪</Text>
                    </View>
                    <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/notifications')}>
                        <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                        {unreadCount > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Activity Rings Card */}
                <Card variant="glow" style={styles.activityCard}>
                    <View style={styles.activityContent}>
                        <ActivityRings size={140} move={0.72} exercise={0.85} stand={0.6} />
                        <View style={styles.activityStats}>
                            <View style={styles.activityStatRow}>
                                <View style={[styles.ringDot, { backgroundColor: colors.ringMove }]} />
                                <View>
                                    <Text style={styles.statValue}>520</Text>
                                    <Text style={styles.statLabel}>Cal burned</Text>
                                </View>
                            </View>
                            <View style={styles.activityStatRow}>
                                <View style={[styles.ringDot, { backgroundColor: colors.ringExercise }]} />
                                <View>
                                    <Text style={styles.statValue}>42</Text>
                                    <Text style={styles.statLabel}>Min active</Text>
                                </View>
                            </View>
                            <View style={styles.activityStatRow}>
                                <View style={[styles.ringDot, { backgroundColor: colors.ringStand }]} />
                                <View>
                                    <Text style={styles.statValue}>7/12</Text>
                                    <Text style={styles.statLabel}>Stand hrs</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Streak + Challenge Row */}
                <View style={styles.streakRow}>
                    {/* Streak Card */}
                    <LinearGradient
                        colors={['rgba(245,158,11,0.2)', 'rgba(239,68,68,0.1)']}
                        style={[styles.streakCard]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.streakEmoji}>🔥</Text>
                        <Text style={styles.streakNum}>{streak}</Text>
                        <Text style={styles.streakSub}>Day Streak</Text>
                    </LinearGradient>

                    {/* Active Challenge */}
                    {activeChallenge && (
                        <TouchableOpacity
                            style={[styles.challengeCard]}
                            activeOpacity={0.85}
                            onPress={() => router.push('/challenges')}
                        >
                            <Text style={styles.challengeIcon}>{activeChallenge.icon}</Text>
                            <Text style={styles.challengeName} numberOfLines={1}>{activeChallenge.title}</Text>
                            <View style={styles.challengeProgressBg}>
                                <View style={[styles.challengeProgressFill, {
                                    width: `${Math.min(activeChallenge.progress / activeChallenge.target, 1) * 100}%` as any,
                                    backgroundColor: activeChallenge.color,
                                }]} />
                            </View>
                            <Text style={styles.challengeProgressText}>
                                {activeChallenge.progress}/{activeChallenge.target} {activeChallenge.unit}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                    <Card style={styles.quickStatCard}>
                        <Ionicons name="footsteps" size={20} color={colors.primary} />
                        <Text style={styles.quickStatValue}>{todaySteps.toLocaleString()}</Text>
                        <Text style={styles.quickStatLabel}>Steps</Text>
                    </Card>
                    <Card style={styles.quickStatCard}>
                        <Ionicons name="heart" size={20} color={colors.tertiary} />
                        <Text style={styles.quickStatValue}>72</Text>
                        <Text style={styles.quickStatLabel}>BPM</Text>
                    </Card>
                    <Card style={styles.quickStatCard}>
                        <Ionicons name="water" size={20} color={colors.info} />
                        <Text style={styles.quickStatValue}>5/8</Text>
                        <Text style={styles.quickStatLabel}>Water</Text>
                    </Card>
                </View>

                {/* Today's Workout */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Workout</Text>
                    <TouchableOpacity onPress={() => router.push('/workouts')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {todayWorkoutData ? (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.push(`/workout/${todayWorkoutData.id}`)}
                    >
                        <LinearGradient
                            colors={[todayWorkoutData.color + '22', colors.surface]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.workoutCard}
                        >
                            <View style={styles.workoutCardContent}>
                                <View style={[styles.workoutIcon, { backgroundColor: todayWorkoutData.color + '25' }]}>
                                    <Ionicons
                                        name={(todayWorkoutData.icon || 'barbell') as any}
                                        size={28}
                                        color={todayWorkoutData.color}
                                    />
                                </View>
                                <View style={styles.workoutInfo}>
                                    <Text style={styles.workoutName}>{todayWorkoutData.name}</Text>
                                    <Text style={styles.workoutMeta}>
                                        {todayWorkoutData.exercises.length} exercises · {todayWorkoutData.duration} min
                                    </Text>
                                </View>
                                <View style={styles.startButton}>
                                    <Ionicons name="play" size={20} color={colors.textInverse} />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <Card style={styles.restCard}>
                        <Ionicons name="leaf" size={32} color={colors.primary} />
                        <Text style={styles.restText}>Rest Day — Recovery is growth 🧘</Text>
                    </Card>
                )}

                {/* Weekly Schedule */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>This Week</Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.weekScroll}
                >
                    {Object.entries(weeklySchedule).map(([day, workout], i) => {
                        const isToday = day === todayDay;
                        return (
                            <View
                                key={day}
                                style={[styles.dayCard, isToday && styles.dayCardActive]}
                            >
                                <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                                    {day}
                                </Text>
                                <View
                                    style={[
                                        styles.dayDot,
                                        {
                                            backgroundColor:
                                                workout === 'Rest'
                                                    ? colors.textTertiary
                                                    : isToday
                                                        ? colors.primary
                                                        : colors.secondary,
                                        },
                                    ]}
                                />
                                <Text
                                    style={[styles.dayWorkout, isToday && styles.dayWorkoutActive]}
                                    numberOfLines={1}
                                >
                                    {workout === 'Rest' ? '🌿' : workout.split(' ')[0]}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Recent Activity */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                </View>
                {workoutLogs.slice(0, 3).map((log) => (
                    <Card key={log.id} style={styles.logCard}>
                        <View style={styles.logRow}>
                            <View style={styles.logLeft}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <View style={{ marginLeft: spacing.md }}>
                                    <Text style={styles.logName}>{log.workoutName}</Text>
                                    <Text style={styles.logMeta}>{log.date}</Text>
                                </View>
                            </View>
                            <View style={styles.logRight}>
                                <Text style={styles.logStat}>{log.duration}m</Text>
                                <Text style={styles.logCalories}>{log.caloriesBurned} cal</Text>
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
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    greeting: {
        ...typography.subhead,
        color: colors.textSecondary,
    },
    name: {
        ...typography.display,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    notifButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    notifBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
    activityCard: {
        marginBottom: spacing.lg,
    },
    activityContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    activityStats: {
        flex: 1,
        marginLeft: spacing.xxl,
        gap: spacing.lg,
    },
    activityStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    ringDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statValue: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    quickStats: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    quickStatCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    quickStatValue: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    quickStatLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    seeAll: {
        ...typography.subhead,
        color: colors.primary,
    },
    workoutCard: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xxl,
    },
    workoutCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    workoutIcon: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    workoutInfo: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    workoutName: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    workoutMeta: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    startButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restCard: {
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.xxxl,
        marginBottom: spacing.xxl,
    },
    restText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    weekScroll: {
        gap: spacing.sm,
        marginBottom: spacing.xxl,
        paddingRight: spacing.xl,
    },
    dayCard: {
        width: 60,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        gap: spacing.sm,
    },
    dayCardActive: {
        backgroundColor: colors.primaryGlow,
        borderWidth: 1,
        borderColor: colors.primary + '40',
    },
    dayLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    dayLabelActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    dayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dayWorkout: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 10,
    },
    dayWorkoutActive: {
        color: colors.primary,
    },
    logCard: {
        marginBottom: spacing.sm,
    },
    logRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logName: {
        ...typography.subhead,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    logMeta: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
    logRight: {
        alignItems: 'flex-end',
    },
    logStat: {
        ...typography.subhead,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    logCalories: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    // Streak + challenge row
    streakRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    streakCard: {
        flex: 1, borderRadius: borderRadius.lg, padding: spacing.lg,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.25)',
    },
    streakEmoji: { fontSize: 28 },
    streakNum: { fontSize: 32, fontWeight: '800', color: colors.warning, lineHeight: 36 },
    streakSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    challengeCard: {
        flex: 2, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
        padding: spacing.lg, justifyContent: 'space-between', borderWidth: 1,
        borderColor: colors.border,
    },
    challengeIcon: { fontSize: 22, marginBottom: 4 },
    challengeName: { ...typography.captionBold, color: colors.textPrimary, marginBottom: spacing.sm },
    challengeProgressBg: { height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
    challengeProgressFill: { height: '100%', borderRadius: 3 },
    challengeProgressText: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
});
