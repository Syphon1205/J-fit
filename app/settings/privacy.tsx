import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useProgressStore } from '../../src/stores/progressStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useNutritionStore } from '../../src/stores/nutritionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useNotificationsStore } from '../../src/stores/notificationsStore';
import { useChallengesStore } from '../../src/stores/challengesStore';
import { useHealthStore } from '../../src/stores/healthStore';
import { useRunStore } from '../../src/stores/runStore';
import { useSessionStore } from '../../src/stores/sessionStore';
import { useCoachingStore } from '../../src/stores/coachingStore';
import { useWorkoutVideoStore } from '../../src/stores/workoutVideoStore';
import { useRepLogStore } from '../../src/stores/repLogStore';
import { safeBack } from '../../src/utils/navigation';
import { appStorage, clearLocalDeviceData } from '../../src/utils/Storage';

const privacySettings = [
    { key: 'shareActivity', label: 'Share Activity Data', desc: 'Allow anonymous usage stats to improve the app' },
    { key: 'crashReports', label: 'Crash Reports', desc: 'Automatically send crash reports to help fix bugs' },
    { key: 'personalization', label: 'Personalized Recommendations', desc: 'Use your data to suggest workouts and meals' },
];

export default function PrivacyScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState({ shareActivity: false, crashReports: true, personalization: true });
    const progressReset = useProgressStore((s) => s.reset);
    const workoutReset = useWorkoutStore((s) => s.reset);
    const nutritionReset = useNutritionStore((s) => s.reset);
    const notificationsReset = useNotificationsStore((s) => s.reset);
    const challengesReset = useChallengesStore((s) => s.reset);
    const healthReset = useHealthStore((s) => s.reset);
    const runsReset = useRunStore((s) => s.reset);
    const sessionReset = useSessionStore((s) => s.reset);
    const coachingReset = useCoachingStore((s) => s.reset);
    const videoReset = useWorkoutVideoStore((s) => s.reset);
    const repsReset = useRepLogStore((s) => s.reset);
    const healthSources = useHealthStore((s) => s.sources);
    const latestSnapshot = useHealthStore((s) => s.latestSnapshot);
    const healthError = useHealthStore((s) => s.lastError);
    const requestHealthPermission = useHealthStore((s) => s.requestPermission);
    const syncHealthNow = useHealthStore((s) => s.syncNow);
    const deleteAccount = useAuthStore((s) => s.deleteAccount);
    const currentHealthSource = healthSources.find((source) =>
        Platform.OS === 'ios' ? source.id === 'apple_health' : source.id === 'google_health'
    ) ?? healthSources[0];

    const handleResetProgress = () => {
        Alert.alert(
            'Reset All Progress',
            'This permanently clears workouts, runs, weight history, meals, health snapshots, agenda items, coaching state, active sessions, and assessments. Your account stays signed in.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything', style: 'destructive',
                    onPress: async () => {
                        progressReset();
                        workoutReset();
                        nutritionReset();
                        notificationsReset();
                        challengesReset();
                        healthReset();
                        runsReset();
                        sessionReset();
                        coachingReset();
                        videoReset();
                        repsReset();
                        await Promise.all([
                            'jfit-progress',
                            'jfit-workouts',
                            'jfit-nutrition',
                            'jfit-notifications',
                            'jfit-challenges',
                            'jfit-health',
                            'jfit-runs',
                            'jfit-session',
                            'jfit-coaching',
                            'jfit-workout-video-assessments',
                            'jfit-rep-logs',
                        ].map((key) => appStorage.removeItem(key)));
                        try { globalThis.localStorage?.removeItem('cf-dashboard-agenda'); } catch {}
                        Alert.alert('Done', 'All progress and training data has been reset.');
                    },
                },
            ]
        );
    };

    const handleClearLocalData = () => {
        Alert.alert(
            'Clear All Local Data',
            'This clears all app data stored on this device, including health snapshots, workouts, progress, settings, and local account state. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Device', style: 'destructive',
                    onPress: async () => {
                        progressReset();
                        workoutReset();
                        nutritionReset();
                        notificationsReset();
                        challengesReset();
                        healthReset();
                        repsReset();
                        await clearLocalDeviceData();
                        await deleteAccount();
                        router.replace('/(auth)/login');
                    },
                },
            ],
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure? This will permanently delete your account and all associated data. You will be signed out.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account', style: 'destructive',
                    onPress: async () => {
                        await deleteAccount();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/profile')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Privacy</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Card style={styles.infoCard}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>Your health data is stored securely on your device and never sold to third parties.</Text>
                </Card>

                <Text style={styles.sectionLabel}>HEALTH SYNC</Text>
                <Card style={styles.healthCard}>
                    <View style={styles.healthHeader}>
                        <View style={[styles.actionIcon, { backgroundColor: currentHealthSource.color + '20' }]}>
                            <Ionicons name={currentHealthSource.icon as any} size={20} color={currentHealthSource.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>{currentHealthSource.name}</Text>
                            <Text style={styles.rowDesc}>
                                {currentHealthSource.connected
                                    ? `Connected${currentHealthSource.lastSync ? ` · ${currentHealthSource.lastSync}` : ''}`
                                    : 'Connect your watch health data for steps, sleep, heart rate, workouts, and readiness.'}
                            </Text>
                        </View>
                        {currentHealthSource.syncing ? <ActivityIndicator color={currentHealthSource.color} /> : null}
                    </View>
                    {latestSnapshot ? (
                        <View style={styles.healthMetrics}>
                            <View style={styles.healthMetric}>
                                <Text style={styles.healthMetricValue}>{latestSnapshot.stepsToday.toLocaleString()}</Text>
                                <Text style={styles.healthMetricLabel}>Steps</Text>
                            </View>
                            <View style={styles.healthMetric}>
                                <Text style={styles.healthMetricValue}>{latestSnapshot.sleepHours ? `${latestSnapshot.sleepHours.toFixed(1)}h` : 'Watch'}</Text>
                                <Text style={styles.healthMetricLabel}>Sleep</Text>
                            </View>
                            <View style={styles.healthMetric}>
                                <Text style={styles.healthMetricValue}>{latestSnapshot.restingHeartRateBpm ? `${latestSnapshot.restingHeartRateBpm}` : 'Watch'}</Text>
                                <Text style={styles.healthMetricLabel}>Resting HR</Text>
                            </View>
                        </View>
                    ) : null}
                    {healthError ? (
                        <View style={styles.healthError}>
                            <Ionicons name="warning-outline" size={15} color={colors.warning} />
                            <Text style={styles.healthErrorText}>{healthError}</Text>
                        </View>
                    ) : null}
                    <View style={styles.healthActions}>
                        {currentHealthSource.connected ? (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={[styles.healthButton, { backgroundColor: currentHealthSource.color }]}
                                onPress={() => syncHealthNow(currentHealthSource.id)}
                                disabled={currentHealthSource.syncing}
                            >
                                <Ionicons name="refresh-outline" size={18} color={colors.textInverse} />
                                <Text style={styles.healthButtonText}>{currentHealthSource.syncing ? 'Syncing health data…' : 'Sync Health Now'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={[styles.healthButton, { backgroundColor: currentHealthSource.color }]}
                                onPress={() => requestHealthPermission(currentHealthSource.id)}
                                disabled={currentHealthSource.syncing}
                            >
                                <Ionicons name="link-outline" size={18} color={colors.textInverse} />
                                <Text style={styles.healthButtonText}>{currentHealthSource.syncing ? 'Requesting access…' : `Connect ${currentHealthSource.name}`}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Card>

                <Text style={styles.sectionLabel}>DATA SHARING</Text>
                <Card style={styles.card}>
                    {privacySettings.map((s, i) => (
                        <View key={s.key} style={[styles.row, i < privacySettings.length - 1 && styles.rowBorder]}>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{s.label}</Text>
                                <Text style={styles.rowDesc}>{s.desc}</Text>
                            </View>
                            <Switch
                                value={settings[s.key as keyof typeof settings]}
                                onValueChange={(v) => setSettings((prev) => ({ ...prev, [s.key]: v }))}
                                trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
                                thumbColor={settings[s.key as keyof typeof settings] ? colors.primary : colors.textTertiary}
                            />
                        </View>
                    ))}
                </Card>

                <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>
                <TouchableOpacity activeOpacity={0.8} onPress={handleResetProgress}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="refresh-outline" size={20} color={colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Reset All Progress</Text>
                            <Text style={styles.rowDesc}>Delete workout logs, weight history, and meal data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={handleClearLocalData}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.error + '20' }]}>
                            <Ionicons name="trash-bin-outline" size={20} color={colors.error} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.rowLabel, { color: colors.error }]}>Clear All Local Data</Text>
                            <Text style={styles.rowDesc}>Reset this device and remove local app storage</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>YOUR DATA RIGHTS</Text>
                <TouchableOpacity activeOpacity={0.8}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="download-outline" size={20} color={colors.info} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Request Data Copy</Text>
                            <Text style={styles.rowDesc}>Get a full export of all your personal data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={handleDeleteAccount}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.error + '20' }]}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.rowLabel, { color: colors.error }]}>Delete Account</Text>
                            <Text style={styles.rowDesc}>Permanently delete your account and all data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>PRIVACY POLICY</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/settings/privacy-policy' as never)}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Read Full Privacy Policy</Text>
                            <Text style={styles.rowDesc}>Review the complete Cunningham Fitness policy</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h3, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.xl, backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.primary + '30' },
    infoText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
    sectionLabel: { ...typography.captionBold, color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.xl },
    healthCard: { gap: spacing.md },
    healthHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    healthMetrics: { flexDirection: 'row', gap: spacing.sm },
    healthMetric: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 14, padding: spacing.md },
    healthMetricValue: { ...typography.bodyBold, color: colors.textPrimary },
    healthMetricLabel: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    healthError: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.warning + '12', borderRadius: 12, padding: spacing.sm },
    healthErrorText: { ...typography.caption, color: colors.warning, flex: 1, lineHeight: 17 },
    healthActions: { flexDirection: 'row' },
    healthButton: { minHeight: 50, borderRadius: 999, paddingHorizontal: spacing.lg, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    healthButtonText: { ...typography.bodyBold, color: colors.textInverse },
    card: { padding: 0 },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    actionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
    actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowInfo: { flex: 1 },
    rowLabel: { ...typography.bodyBold, color: colors.textPrimary },
    rowDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
    policyCard: { gap: spacing.md },
    policyIntro: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
    policyBlock: { backgroundColor: colors.surfaceLight, borderRadius: 16, padding: spacing.md },
    policyTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 3 },
});
