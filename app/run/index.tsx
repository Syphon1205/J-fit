import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    PanResponder,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors, typography, spacing } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useRunStore, RunSession } from '../../src/stores/runStore';
import { safeBack } from '../../src/utils/navigation';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const { width } = Dimensions.get('window');

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
};

const formatPace = (pace: number) => {
    if (!isFinite(pace) || pace <= 0) return "--'--\"";
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `${min}'${String(sec).padStart(2, '0')}"`;
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

type RunGoal = 'easy' | 'speed' | 'distance' | 'recovery';

const GOALS: RunGoal[] = ['easy', 'speed', 'distance', 'recovery'];

export default function RunScreen() {
    const router = useRouter();
    const { colors: theme } = useThemeColors();
    const { sessions } = useRunStore();
    const [goal, setGoal] = useState<RunGoal>('easy');
    const [goalRowWidth, setGoalRowWidth] = useState(0);
    const [locationReady, setLocationReady] = useState<boolean | null>(null);
    const screenFade = useRef(new Animated.Value(0)).current;
    const screenRise = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(screenFade, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.timing(screenRise, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]).start();

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationReady(status === 'granted');
        })();
    }, []);

    const totalDistance = sessions.reduce((s, r) => s + r.distance, 0);
    const totalRuns = sessions.length;
    const totalCalories = sessions.reduce((s, r) => s + r.calories, 0);
    const bestPace = sessions.length > 0
        ? Math.min(...sessions.map((r) => r.avgPace).filter((p) => p > 0))
        : 0;

    const setGoalFromX = useMemo(() => {
        return (x: number) => {
            if (goalRowWidth <= 0) return;
            const chipWidth = goalRowWidth / GOALS.length;
            const idx = Math.max(0, Math.min(GOALS.length - 1, Math.floor(x / chipWidth)));
            setGoal(GOALS[idx]);
        };
    }, [goalRowWidth]);

    const goalSwipeResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: (evt) => setGoalFromX(evt.nativeEvent.locationX),
                onPanResponderMove: (evt) => setGoalFromX(evt.nativeEvent.locationX),
            }),
        [setGoalFromX]
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                style={{ opacity: screenFade, transform: [{ translateY: screenRise }] }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.title, { color: theme.textPrimary }]}>Running</Text>
                        <Text style={[styles.subtitle, { color: theme.textTertiary }]}>Clean tracking. Just run.</Text>
                    </View>
                    <TouchableOpacity onPress={() => safeBack(router, '/workouts')} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
                        <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.safetyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={theme.warning} />
                    <Text style={[styles.safetyText, { color: theme.textSecondary }]}>Safety reminder: stay alert, visible, and avoid isolated roads at night.</Text>
                    {locationReady != null && (
                        <Text style={[styles.safetyPill, { color: locationReady ? theme.success : theme.error }]}>● {locationReady ? 'GPS Ready' : 'GPS Off'}</Text>
                    )}
                </View>

                <View
                    style={[styles.goalRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onLayout={(e) => setGoalRowWidth(e.nativeEvent.layout.width)}
                    {...goalSwipeResponder.panHandlers}
                >
                    {GOALS.map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.goalChip, goal === g && { backgroundColor: theme.primaryGlow }]}
                            onPress={() => setGoal(g)}
                            activeOpacity={0.9}
                        >
                            <Text style={[styles.goalText, { color: theme.textSecondary }, goal === g && { color: theme.primary }]}>
                                {g[0].toUpperCase() + g.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Big Start Button */}
                <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => router.push({ pathname: '/run/tracker', params: { goal } })}
                    style={styles.startCard}
                >
                    <LinearGradient
                        colors={[theme.surface, theme.surfaceLight]}
                        style={[styles.startGradient, { borderColor: theme.border }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                            <View style={styles.startContent}>
                            <View style={[styles.startIcon, { backgroundColor: theme.primary }]}>
                                <Ionicons name="play" size={24} color={theme.textInverse} />
                            </View>
                            <View>
                                <Text style={[styles.startTitle, { color: theme.textPrimary }]}>Start Run</Text>
                                <Text style={[styles.startSub, { color: theme.textTertiary }]}>
                                    Live route • GPS trail • Start / End controls
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'Total Runs', value: totalRuns.toString(), icon: 'footsteps-outline', color: theme.primary },
                        { label: 'Distance', value: `${totalDistance.toFixed(1)} km`, icon: 'map-outline', color: theme.secondary },
                        { label: 'Best Pace', value: formatPace(bestPace), icon: 'speedometer-outline', color: theme.tertiary },
                        { label: 'Calories', value: `${totalCalories}`, icon: 'flame-outline', color: '#F59E0B' },
                    ].map((stat) => (
                        <Card key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface }]}>
                            <Ionicons name={stat.icon as any} size={18} color={stat.color} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{stat.label}</Text>
                        </Card>
                    ))}
                </View>

                {/* Weekly mileage bar */}
                {sessions.length > 0 && (
                    <Card style={[styles.weeklyCard, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>This Week</Text>
                        <View style={styles.weeklyBars}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                const today = new Date().getDay();
                                const dayIndex = (i + 1) % 7;
                                const isToday = dayIndex === today;
                                const hasRun = sessions.some((s) => {
                                    const d = new Date(s.date).getDay();
                                    return d === dayIndex;
                                });
                                const sessionKm = sessions
                                    .filter((s) => new Date(s.date).getDay() === dayIndex)
                                    .reduce((sum, s) => sum + s.distance, 0);
                                const maxKm = Math.max(10, ...sessions.map((s) => s.distance));
                                const barH = hasRun ? Math.max(0.15, sessionKm / maxKm) : 0.05;
                                return (
                                    <View key={i} style={styles.barGroup}>
                                        <View style={styles.barContainer}>
                                            <LinearGradient
                                                colors={hasRun ? [theme.primary, theme.primaryDim] : [theme.surfaceLight, theme.surfaceLight]}
                                                style={[styles.bar, { height: `${barH * 100}%` }]}
                                            />
                                        </View>
                                        <Text style={[styles.barLabel, { color: theme.textTertiary }, isToday && { color: theme.primary }]}>{day}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </Card>
                )}

                {/* Recent Runs */}
                <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Recent Runs</Text>
                {sessions.length === 0 ? (
                    <Card style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
                        <Ionicons name="footsteps-outline" size={40} color={theme.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No runs yet</Text>
                        <Text style={[styles.emptyDesc, { color: theme.textTertiary }]}>Hit Start Run to track your first GPS run</Text>
                    </Card>
                ) : (
                    sessions.map((run) => <RunCard key={run.id} run={run} theme={theme} />)
                )}
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

function RunCard({ run, theme }: { run: RunSession; theme: ReturnType<typeof useThemeColors>['colors'] }) {
    const router = useRouter();
    return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({ pathname: '/run/[id]', params: { id: run.id } })}>
            <Card style={[styles.runCard, { backgroundColor: theme.surface }]}>
                <View style={styles.runCardTop}>
                    <View style={[styles.runIconCircle, { backgroundColor: theme.primaryGlow }]}>
                        <Ionicons name="footsteps" size={18} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.runDate, { color: theme.textTertiary }]}>{formatDate(run.date)}</Text>
                        <Text style={[styles.runDuration, { color: theme.textPrimary }]}>{formatDuration(run.duration)}</Text>
                    </View>
                    <Text style={[styles.runDistance, { color: theme.textPrimary }]}>{run.distance.toFixed(2)} <Text style={[styles.runDistUnit, { color: theme.textSecondary }]}>km</Text></Text>
                </View>
                <View style={styles.runStats}>
                    <View style={styles.runStat}>
                        <Ionicons name="speedometer-outline" size={12} color={theme.textTertiary} />
                        <Text style={[styles.runStatText, { color: theme.textSecondary }]}>{formatPace(run.avgPace)}/km</Text>
                    </View>
                    <View style={styles.runStat}>
                        <Ionicons name="flame-outline" size={12} color={theme.tertiary} />
                        <Text style={[styles.runStatText, { color: theme.textSecondary }]}>{run.calories} kcal</Text>
                    </View>
                    {run.elevationGain != null && (
                        <View style={styles.runStat}>
                            <Ionicons name="trending-up-outline" size={12} color={theme.secondary} />
                            <Text style={[styles.runStatText, { color: theme.textSecondary }]}>+{run.elevationGain}m</Text>
                        </View>
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 76 : 12, paddingBottom: 32, gap: 16 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 8 },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { ...typography.h1, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textTertiary, marginTop: 2 },
    safetyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    safetyText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    safetyPill: { ...typography.caption, fontWeight: '700' },
    goalRow: {
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
        padding: 4,
    },
    goalChip: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingVertical: 8,
        borderRadius: 999,
        alignItems: 'center',
    },
    goalChipActive: {
        backgroundColor: `${colors.primary}24`,
    },
    goalText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    goalTextActive: { color: colors.primary },
    startCard: { borderRadius: 28, overflow: 'hidden' },
    startGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    startContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    startIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
    startSub: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: { flex: 1, alignItems: 'center', padding: 12, gap: 2, backgroundColor: '#FFFFFF', borderRadius: 24 },
    statValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { ...typography.caption, color: colors.textTertiary, fontSize: 10, textAlign: 'center' },
    weeklyCard: { padding: 16 },
    sectionTitle: { ...typography.caption, color: colors.textTertiary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    weeklyBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 64, marginTop: 12 },
    barGroup: { flex: 1, alignItems: 'center', gap: 4 },
    barContainer: { flex: 1, width: '100%', justifyContent: 'flex-end' },
    bar: { width: '100%', borderRadius: 4, minHeight: 4 },
    barLabel: { ...typography.caption, color: colors.textTertiary, fontSize: 10 },
    emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyTitle: { ...typography.h3, color: colors.textSecondary },
    emptyDesc: { ...typography.body, color: colors.textTertiary, textAlign: 'center', fontSize: 13 },
    runCard: { padding: 14, gap: 10 },
    runCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    runIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryGlow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    runDate: { ...typography.caption, color: colors.textTertiary },
    runDuration: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
    runDistance: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
    runDistUnit: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
    runStats: { flexDirection: 'row', gap: 16, paddingLeft: 52 },
    runStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    runStatText: { ...typography.caption, color: colors.textSecondary },
});
