import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    AppState,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { BackButton, Card, Button } from '../../src/components/ui';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { safeBack } from '../../src/utils/navigation';
import { mediumImpact } from '../../src/utils/haptics';

const { width } = Dimensions.get('window');

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function WorkoutTimerScreen() {
    const router = useRouter();
    const { activeWorkout, completeExercise, endWorkout } = useWorkoutStore();
    const [elapsed, setElapsed] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(0);
    const [restDuration, setRestDuration] = useState(0);
    const [currentExIdx, setCurrentExIdx] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startAtRef = useRef<number>(Date.now());
    const pausedAtRef = useRef<number | null>(null);
    const pausedMsRef = useRef<number>(0);
    const restEndAtRef = useRef<number | null>(null);
    const appStateRef = useRef(AppState.currentState);
    const restNotificationIdRef = useRef<string | null>(null);

    const cancelRestNotification = async () => {
        if (restNotificationIdRef.current) {
            await Notifications.cancelScheduledNotificationAsync(restNotificationIdRef.current);
            restNotificationIdRef.current = null;
        }
    };

    const scheduleRestDoneNotification = async (seconds: number, nextExerciseName: string) => {
        await cancelRestNotification();
        if (seconds <= 0) return;
        restNotificationIdRef.current = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Rest complete',
                body: `Up next: ${nextExerciseName}`,
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds,
            },
        });
    };

    const recalculateTimer = () => {
        const now = Date.now();
        const pausedSnapshot = pausedMsRef.current + (isPaused && pausedAtRef.current ? now - pausedAtRef.current : 0);
        const elapsedSecs = Math.max(0, Math.floor((now - startAtRef.current - pausedSnapshot) / 1000));
        setElapsed(elapsedSecs);

        if (isResting && restEndAtRef.current) {
            const remaining = Math.max(0, Math.ceil((restEndAtRef.current - now) / 1000));
            setRestTime(remaining);
            if (remaining <= 0) {
                restEndAtRef.current = null;
                setIsResting(false);
                setRestDuration(0);
                restNotificationIdRef.current = null;
            }
        }
    };

    useEffect(() => {
        recalculateTimer();
        if (!isPaused) {
            intervalRef.current = setInterval(recalculateTimer, 500);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPaused, isResting]);

    useEffect(() => {
        const configureNotifications = async () => {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                });
            }

            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                await Notifications.requestPermissionsAsync();
            }
        };

        configureNotifications();

        const subscription = AppState.addEventListener('change', (nextState) => {
            const wasBackground = appStateRef.current === 'background' || appStateRef.current === 'inactive';
            if (wasBackground && nextState === 'active') {
                recalculateTimer();
            }
            appStateRef.current = nextState;
        });

        return () => {
            subscription.remove();
        };
    }, [isPaused, isResting]);

    useEffect(() => {
        return () => {
            cancelRestNotification();
        };
    }, []);

    if (!activeWorkout) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.noWorkout}>No active workout</Text>
                    <Button title="Go Back" onPress={() => safeBack(router, '/workouts')} variant="secondary" />
                </View>
            </SafeAreaView>
        );
    }

    const exercises = activeWorkout.exercises;
    const currentEx = exercises[currentExIdx];
    const progress = currentExIdx / exercises.length;

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleCompleteExercise = async () => {
        await mediumImpact();
        completeExercise(currentExIdx);
        if (currentExIdx < exercises.length - 1) {
            const nextExercise = exercises[currentExIdx + 1];
            setIsResting(true);
            setRestTime(currentEx.restTime);
            setRestDuration(currentEx.restTime);
            restEndAtRef.current = Date.now() + currentEx.restTime * 1000;
            scheduleRestDoneNotification(currentEx.restTime, nextExercise.name);
            setCurrentExIdx(currentExIdx + 1);
        }
    };

    const handleFinish = async () => {
        await mediumImpact();
        cancelRestNotification();
        endWorkout(elapsed);
        safeBack(router, '/workouts');
    };

    const ringSize = width * 0.65;
    const strokeWidth = 8;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const timerProgress = isResting
        ? Math.max(0, Math.min(1, restTime / Math.max(1, restDuration || currentEx?.restTime || 60)))
        : progress;

    return (
        <SafeAreaView style={styles.container}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <BackButton fallback="/workouts" />
                <Text style={styles.workoutTitle}>{activeWorkout.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Timer Ring */}
                <View style={styles.timerContainer}>
                    <Svg width={ringSize} height={ringSize}>
                        <Circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={radius}
                            stroke={colors.surface}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <Circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={radius}
                            stroke={isResting ? colors.warning : colors.primary}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - timerProgress)}
                            strokeLinecap="round"
                            transform={`rotate(-90, ${ringSize / 2}, ${ringSize / 2})`}
                        />
                    </Svg>
                    <View style={styles.timerContent}>
                        {isResting ? (
                            <>
                                <Text style={styles.restLabel}>REST</Text>
                                <Text style={styles.timerText}>{formatTime(restTime)}</Text>
                                <TouchableOpacity onPress={() => { setIsResting(false); setRestTime(0); setRestDuration(0); restEndAtRef.current = null; cancelRestNotification(); }}>
                                    <Text style={styles.skipRest}>Skip →</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.timerLabel}>ELAPSED</Text>
                                <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
                                <Text style={styles.timerSub}>
                                    Exercise {currentExIdx + 1}/{exercises.length}
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Current Exercise */}
                {currentEx && (
                    <Card variant="glow" style={styles.currentCard}>
                        <View style={styles.currentHeader}>
                            <Text style={styles.currentLabel}>CURRENT EXERCISE</Text>
                            <Text style={styles.currentName}>{currentEx.name}</Text>
                        </View>
                        <View style={styles.currentMeta}>
                            <View style={styles.currentMetaItem}>
                                <Text style={styles.currentMetaValue}>{currentEx.sets}</Text>
                                <Text style={styles.currentMetaLabel}>Sets</Text>
                            </View>
                            <View style={styles.currentMetaDivider} />
                            <View style={styles.currentMetaItem}>
                                <Text style={styles.currentMetaValue}>{currentEx.reps}</Text>
                                <Text style={styles.currentMetaLabel}>Reps</Text>
                            </View>
                            {currentEx.weight && (
                                <>
                                    <View style={styles.currentMetaDivider} />
                                    <View style={styles.currentMetaItem}>
                                        <Text style={styles.currentMetaValue}>{currentEx.weight}</Text>
                                        <Text style={styles.currentMetaLabel}>Weight</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </Card>
                )}

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.controlBtn}
                        onPress={() => {
                            setIsPaused((prev) => {
                                const next = !prev;
                                if (next) {
                                    pausedAtRef.current = Date.now();
                                } else if (pausedAtRef.current) {
                                    pausedMsRef.current += Date.now() - pausedAtRef.current;
                                    pausedAtRef.current = null;
                                }
                                return next;
                            });
                        }}
                    >
                        <Ionicons
                            name={isPaused ? 'play' : 'pause'}
                            size={28}
                            color={colors.textPrimary}
                        />
                    </TouchableOpacity>

                    {currentExIdx < exercises.length - 1 ? (
                        <TouchableOpacity
                            style={styles.mainBtn}
                            onPress={handleCompleteExercise}
                            disabled={isResting}
                        >
                            <Text style={styles.mainBtnText}>
                                {isResting ? 'Resting...' : 'Complete Set ✓'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                            <Text style={styles.mainBtnText}>Finish Workout 🎉</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.controlBtn} onPress={handleFinish}>
                        <Ionicons name="stop" size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>

                {/* Exercise Queue */}
                <Text style={styles.queueTitle}>Up Next</Text>
                {exercises.slice(currentExIdx + 1, currentExIdx + 4).map((ex, i) => (
                    <View key={ex.id} style={styles.queueItem}>
                        <View style={styles.queueIndex}>
                            <Text style={styles.queueIndexText}>{currentExIdx + i + 2}</Text>
                        </View>
                        <View style={styles.queueInfo}>
                            <Text style={styles.queueName}>{ex.name}</Text>
                            <Text style={styles.queueMeta}>{ex.sets} × {ex.reps}{ex.weight ? ` · ${ex.weight}` : ''}</Text>
                        </View>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
    noWorkout: { ...typography.h2, color: colors.textSecondary },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
    },
    workoutTitle: { ...typography.bodyBold, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl, alignItems: 'center' },
    timerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: spacing.xl,
    },
    timerContent: {
        position: 'absolute',
        alignItems: 'center',
    },
    timerLabel: { ...typography.captionBold, color: colors.textTertiary, letterSpacing: 2 },
    restLabel: { ...typography.captionBold, color: colors.warning, letterSpacing: 2 },
    timerText: { ...typography.stat, color: colors.textPrimary, marginVertical: spacing.xs },
    timerSub: { ...typography.caption, color: colors.textSecondary },
    skipRest: { ...typography.bodyBold, color: colors.warning, marginTop: spacing.sm },
    currentCard: { width: '100%', marginBottom: spacing.xxl },
    currentHeader: { marginBottom: spacing.lg },
    currentLabel: { ...typography.captionBold, color: colors.primary, letterSpacing: 1.5 },
    currentName: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.xs },
    currentMeta: { flexDirection: 'row', alignItems: 'center' },
    currentMetaItem: { flex: 1, alignItems: 'center' },
    currentMetaValue: { ...typography.h2, color: colors.textPrimary },
    currentMetaLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    currentMetaDivider: { width: 1, height: 40, backgroundColor: colors.border },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        marginBottom: spacing.xxl,
    },
    controlBtn: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    mainBtn: {
        flex: 1,
        paddingVertical: spacing.lg,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    finishBtn: {
        flex: 1,
        paddingVertical: spacing.lg,
        backgroundColor: colors.success,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    mainBtnText: { ...typography.bodyBold, color: colors.textInverse },
    queueTitle: { ...typography.bodyBold, color: colors.textSecondary, alignSelf: 'flex-start', marginBottom: spacing.md },
    queueItem: {
        flexDirection: 'row', alignItems: 'center',
        width: '100%',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    queueIndex: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
    },
    queueIndexText: { ...typography.caption, color: colors.textTertiary },
    queueInfo: { flex: 1 },
    queueName: { ...typography.subhead, color: colors.textSecondary },
    queueMeta: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
});
