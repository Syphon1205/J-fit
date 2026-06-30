import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuthStore } from '../stores/authStore';
import { useHealthStore } from '../stores/healthStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { buildTrainerMetricPayload, createPairingCode, TrainerPairingStatus } from '../services/trainerSync';
import { isTrainerProximityAvailable, listenToTrainerProximity, startTrainerProximityAdvertising, stopTrainerProximityAdvertising } from '../services/trainerProximity';

export default function Profile() {
    const router = useRouter();
    const { colors } = useThemeColors();
    const { user, logout, deviceId } = useAuthStore();
    const { workoutLogs } = useWorkoutStore();
    const latestSnapshot = useHealthStore((state) => state.latestSnapshot);
    const sources = useHealthStore((state) => state.sources);
    const syncHealthSnapshot = useHealthStore((state) => state.syncHealthSnapshot);
    const styles = makeStyles(colors);
    const totalCalories = workoutLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);
    const healthConnected = sources.some((source) => source.connected);
    const [syncStatus, setSyncStatus] = useState<TrainerPairingStatus>('idle');
    const [syncMessage, setSyncMessage] = useState('Trainer desktop can find this phone when you start sharing.');
    const [refreshKey, setRefreshKey] = useState(0);
    const payload = useMemo(() => buildTrainerMetricPayload(), [latestSnapshot, workoutLogs.length, refreshKey]);
    const pairingCode = createPairingCode(deviceId ?? payload.athlete.deviceId);

    useEffect(() => {
        let mounted = true;
        let cleanup: Array<{ remove: () => Promise<void> }> = [];

        void listenToTrainerProximity((event) => {
            if (!mounted) return;
            if (event.type === 'invite') setSyncMessage(`${event.peer} found your phone. Accepting sync.`);
            if (event.type === 'connecting') {
                setSyncStatus('searching');
                setSyncMessage(`Connecting to ${event.peer}…`);
            }
            if (event.type === 'connected') {
                setSyncStatus('ready');
                setSyncMessage(`Synced with ${event.peer}.`);
            }
            if (event.type === 'disconnected') {
                setSyncStatus('idle');
                setSyncMessage(`${event.peer} disconnected.`);
            }
            if (event.type === 'error') {
                setSyncStatus('error');
                setSyncMessage(event.message ?? 'Nearby trainer sync failed.');
            }
        }).then((handles) => {
            cleanup = handles;
        });

        return () => {
            mounted = false;
            cleanup.forEach((handle) => void handle.remove());
            void stopTrainerProximityAdvertising();
        };
    }, []);

    const startTrainerSync = async () => {
        setSyncStatus('searching');
            setSyncMessage('Step 1 of 2: refreshing watch metrics before sharing.');
            try {
                await syncHealthSnapshot().catch(() => undefined);
                setSyncMessage('Step 2 of 2: making this phone visible to the trainer desktop app.');
                const freshPayload = buildTrainerMetricPayload();
                setRefreshKey((value) => value + 1);
                await startTrainerProximityAdvertising(freshPayload);
                setSyncStatus('ready');
                setSyncMessage('Phone is visible. Tell your trainer to press Find Client Device.');
        } catch (error) {
            setSyncStatus('error');
            setSyncMessage(error instanceof Error ? error.message : 'Nearby trainer sync is unavailable on this device.');
        }
    };

    const stopTrainerSync = async () => {
        await stopTrainerProximityAdvertising();
        setSyncStatus('idle');
        setSyncMessage('Nearby trainer sync stopped.');
    };

    const signOut = () => {
        Alert.alert('Sign out?', 'You can sign back in or continue as guest anytime.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.hero}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(user?.name || 'J').slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.title}>{user?.name || 'Athlete'}</Text>
                    <Text style={styles.subtitle}>{user?.email || 'Cunningham Fitness member'}</Text>
                    <View style={styles.devicePill}>
                        <Text style={styles.deviceText}>Device profile {deviceId ? deviceId.slice(0, 10) : 'local'}</Text>
                    </View>
                </View>

                <View style={styles.metrics}>
                    {[
                        ['Training Blocks', String(workoutLogs.length)],
                        ['Calories Burned', totalCalories.toLocaleString()],
                        ['Protocol Status', 'Active'],
                    ].map(([label, value]) => (
                        <View key={label} style={styles.metric}>
                            <Text style={styles.metricLabel}>{label}</Text>
                            <Text style={styles.metricValue}>{value}</Text>
                        </View>
                    ))}
                </View>

                <LinearGradient colors={[colors.primary + '24', colors.secondary + '16']} style={styles.syncCard}>
                    <View style={styles.syncTop}>
                        <View style={styles.settingIcon}><Ionicons name="people-outline" size={22} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingTitle}>Trainer Nearby Sync</Text>
                            <Text style={styles.settingCopy}>Share your watch, workout, sleep, and run packet with the trainer desktop app.</Text>
                        </View>
                    </View>
                    <View style={styles.syncMeta}>
                        <View style={styles.syncPill}>
                            <Text style={styles.syncPillLabel}>Pairing</Text>
                            <Text style={styles.syncPillValue}>{pairingCode}</Text>
                        </View>
                        <View style={styles.syncPill}>
                            <Text style={styles.syncPillLabel}>Health</Text>
                            <Text style={styles.syncPillValue}>{latestSnapshot ? latestSnapshot.sourceLabel : 'Not synced'}</Text>
                        </View>
                    </View>
                    <Text style={styles.syncMessage}>{syncMessage}</Text>
                    <View style={styles.syncActions}>
                        <TouchableOpacity style={styles.syncPrimary} onPress={startTrainerSync} activeOpacity={0.88}>
                            <Ionicons name={syncStatus === 'searching' ? 'radio-outline' : 'wifi-outline'} size={18} color={colors.textInverse} />
                            <Text style={styles.syncPrimaryText}>{syncStatus === 'searching' ? 'Sharing…' : 'Start Local Sync'}</Text>
                        </TouchableOpacity>
                        {syncStatus === 'ready' || syncStatus === 'searching' ? (
                            <TouchableOpacity style={styles.syncStop} onPress={stopTrainerSync}>
                                <Text style={styles.syncStopText}>Stop</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    {!isTrainerProximityAvailable() ? (
                        <Text style={styles.syncFootnote}>Nearby trainer sync requires the iPhone native app on the same local network as the trainer Mac.</Text>
                    ) : null}
                </LinearGradient>

                {[
                    ['Profile Settings', 'Adjust body metrics, goals, and coaching preferences.', 'settings-outline', '/settings/profile'],
                    ['App Preferences', 'Theme presets, health sync, and local device data.', 'options-outline', '/settings/appearance'],
                    ['Health and Privacy', healthConnected ? 'Manage health sync, permissions, privacy, and export controls.' : 'Connect health sync, manage permissions, privacy, and export controls.', 'shield-checkmark-outline', '/settings/privacy'],
                ].map(([title, copy, icon, href]) => (
                    <TouchableOpacity key={title} style={styles.setting} onPress={() => router.push(href as never)}>
                        <View style={styles.settingIcon}><Ionicons name={icon as any} size={22} color={colors.primary} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.settingTitle}>{title}</Text>
                            <Text style={styles.settingCopy}>{copy}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.signOut} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 18, paddingBottom: 118, gap: 14 },
    hero: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 34, borderWidth: 1, borderColor: colors.border, padding: 24, marginTop: 12 },
    avatar: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryGlow },
    avatarText: { color: colors.primary, fontSize: 36, fontWeight: '900' },
    title: { color: colors.textPrimary, fontSize: 34, fontWeight: '900', letterSpacing: -1, marginTop: 14, textAlign: 'center' },
    subtitle: { color: colors.textSecondary, fontSize: 16, fontWeight: '600', marginTop: 6, textAlign: 'center' },
    devicePill: { marginTop: 14, borderRadius: 999, backgroundColor: colors.surfaceLight, paddingHorizontal: 14, paddingVertical: 9 },
    deviceText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    metrics: { gap: 12 },
    metric: { backgroundColor: colors.surface, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 18 },
    metricLabel: { color: colors.textSecondary, fontSize: 15, fontWeight: '800' },
    metricValue: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', marginTop: 8 },
    syncCard: { borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12, overflow: 'hidden' },
    syncTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    syncMeta: { flexDirection: 'row', gap: 10 },
    syncPill: { flex: 1, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12 },
    syncPillLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    syncPillValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '900', marginTop: 4 },
    syncMessage: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', lineHeight: 19 },
    syncActions: { flexDirection: 'row', gap: 10 },
    syncPrimary: { flex: 1, minHeight: 50, borderRadius: 999, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    syncPrimaryText: { color: colors.textInverse, fontSize: 15, fontWeight: '900' },
    syncStop: { minHeight: 50, borderRadius: 999, backgroundColor: colors.surfaceLight, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
    syncStopText: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
    syncFootnote: { color: colors.textTertiary, fontSize: 12, fontWeight: '700', lineHeight: 17 },
    setting: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 16 },
    settingIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    settingTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
    settingCopy: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 4 },
    signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surfaceLight, borderRadius: 999, minHeight: 56 },
    signOutText: { color: colors.textSecondary, fontSize: 17, fontWeight: '900' },
});
