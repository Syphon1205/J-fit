import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuthStore } from '../stores/authStore';
import { buildTrainerMetricPayload, createPairingCode, TrainerPairingStatus } from '../services/trainerSync';
import { isTrainerProximityAvailable, listenToTrainerProximity, startTrainerProximityAdvertising, stopTrainerProximityAdvertising } from '../services/trainerProximity';
import { useHealthStore } from '../stores/healthStore';
import { safeBack } from '../utils/navigation';

export default function TrainerSync() {
    const router = useRouter();
    const { colors } = useThemeColors();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const deviceId = useAuthStore((state) => state.deviceId);
    const syncHealthSnapshot = useHealthStore((state) => state.syncHealthSnapshot);
    const [status, setStatus] = useState<TrainerPairingStatus>('idle');
    const [message, setMessage] = useState('Start this while the trainer app is searching for a client.');
    const [refreshKey, setRefreshKey] = useState(0);
    const payload = useMemo(() => buildTrainerMetricPayload(), [status, refreshKey]);
    const pairingCode = createPairingCode(deviceId ?? payload.athlete.deviceId);

    useEffect(() => {
        let active = true;
        let cleanup: Array<{ remove: () => Promise<void> }> = [];

        void listenToTrainerProximity((event) => {
            if (!active) return;
            if (event.type === 'invite') setMessage(`${event.peer} found you. Accepting secure local sync.`);
            if (event.type === 'connecting') {
                setStatus('searching');
                setMessage(`Connecting to ${event.peer}…`);
            }
            if (event.type === 'connected') {
                setStatus('ready');
                setMessage(`Synced with ${event.peer}. Your trainer can review this packet now.`);
            }
            if (event.type === 'disconnected') {
                setStatus('idle');
                setMessage(`${event.peer} disconnected. Start again when your trainer is ready.`);
            }
            if (event.type === 'error') {
                setStatus('error');
                setMessage(event.message ?? 'Nearby trainer sync failed.');
            }
        }).then((handles) => {
            cleanup = handles;
        });

        return () => {
            active = false;
            cleanup.forEach((handle) => void handle.remove());
            void stopTrainerProximityAdvertising();
        };
    }, []);

    const startPairing = async () => {
        setStatus('searching');
        setMessage('Refreshing health data, then advertising securely nearby.');
        try {
            await syncHealthSnapshot().catch(() => undefined);
            const freshPayload = buildTrainerMetricPayload();
            setRefreshKey((value) => value + 1);
            await startTrainerProximityAdvertising(freshPayload);
            setStatus('ready');
            setMessage('Ready. Ask the trainer to press Find Client Device and invite your phone.');
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Nearby trainer sync is unavailable on this build.');
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => safeBack(router, '/profile')}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trainer Sync</Text>
            </View>

            <View style={styles.hero}>
                <Text style={styles.kicker}>With Trainer</Text>
                <Text style={styles.title}>Share clean metrics nearby</Text>
                <Text style={styles.copy}>
                    Start this while the trainer desktop app is looking for a client. Cunningham Fitness prepares your health, training, sleep, and run summary for review.
                </Text>
                <View style={styles.localBadge}>
                    <Ionicons name={isTrainerProximityAvailable() ? 'wifi-outline' : 'alert-circle-outline'} size={17} color={colors.primary} />
                    <Text style={styles.localBadgeText}>{isTrainerProximityAvailable() ? 'Local network sync available' : 'Use an iPhone build for nearby trainer sync'}</Text>
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={startPairing} activeOpacity={0.88}>
                    <Ionicons name={status === 'searching' ? 'radio-outline' : 'pulse-outline'} size={20} color={colors.textInverse} />
                    <Text style={styles.primaryText}>{status === 'searching' ? 'Looking for Trainer' : 'Sync With Trainer'}</Text>
                </TouchableOpacity>
                {status === 'ready' || status === 'searching' ? (
                    <TouchableOpacity style={styles.stopButton} onPress={() => {
                        void stopTrainerProximityAdvertising();
                        setStatus('idle');
                        setMessage('Nearby sync stopped.');
                    }}>
                        <Text style={styles.stopText}>Stop Sharing</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={styles.codeCard}>
                <Text style={styles.label}>Pairing Code</Text>
                <Text style={styles.code}>{pairingCode}</Text>
                <Text style={styles.muted}>{message}</Text>
            </View>

            <View style={styles.grid}>
                {[
                    ['Steps', payload.health?.stepsToday.toLocaleString() ?? 'Not synced'],
                    ['Sleep', payload.health?.sleepHours ? `${payload.health.sleepHours.toFixed(1)} hr` : 'Missing'],
                    ['HRV', payload.health?.hrvMs ? `${payload.health.hrvMs} ms` : 'Missing'],
                    ['Runs', String(payload.training.recentRuns.length)],
                ].map(([label, value]) => (
                    <View key={label} style={styles.metric}>
                        <Text style={styles.metricLabel}>{label}</Text>
                        <Text style={styles.metricValue}>{value}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.panel}>
                <Text style={styles.panelTitle}>Trainer Review Packet</Text>
                {[
                    'Readiness markers',
                    'Sleep and recovery gaps',
                    'Weekly steps and calories',
                    'Recent runs and pace',
                    'Weight trend and training consistency',
                ].map((item) => (
                    <View key={item} style={styles.row}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={styles.rowText}>{item}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 18, paddingBottom: 34, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
    hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 28, padding: 20 },
    kicker: { color: colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
    title: { color: colors.textPrimary, fontSize: 31, lineHeight: 34, fontWeight: '900', marginTop: 8 },
    copy: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 },
    localBadge: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: colors.primaryGlow, paddingHorizontal: 12, paddingVertical: 9, alignSelf: 'flex-start' },
    localBadgeText: { color: colors.textPrimary, fontSize: 12, fontWeight: '900' },
    primaryButton: { marginTop: 18, minHeight: 54, borderRadius: 999, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    primaryText: { color: colors.textInverse, fontSize: 16, fontWeight: '900' },
    stopButton: { marginTop: 10, minHeight: 48, borderRadius: 999, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    stopText: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
    codeCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 18 },
    label: { color: colors.textSecondary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
    code: { color: colors.textPrimary, fontSize: 42, fontWeight: '900', marginTop: 4 },
    muted: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metric: { width: '48%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 14 },
    metricLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
    metricValue: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 5 },
    panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 18, gap: 12 },
    panelTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    rowText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
});
