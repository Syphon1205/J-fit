import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'expo-router';
import { Activity, Flame, Footprints, HeartPulse, LogOut, RefreshCw, Route, Settings, ShieldCheck, Smartphone, User, Wifi, XCircle, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useHealthStore } from '../stores/healthStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { buildTrainerMetricPayload, createPairingCode, type TrainerPairingStatus } from '../services/trainerSync';
import { getTrainerProximityRuntime, listenToTrainerProximity, startTrainerProximityAdvertising, stopTrainerProximityAdvertising } from '../services/trainerProximity';

export default function Profile() {
    const router = useRouter();
    const { user, logout, deviceId } = useAuthStore();
    const { workoutLogs } = useWorkoutStore();
    const latestSnapshot = useHealthStore((state) => state.latestSnapshot);
    const sources = useHealthStore((state) => state.sources);
    const syncHealthSnapshot = useHealthStore((state) => state.syncHealthSnapshot);
    const [syncStatus, setSyncStatus] = useState<TrainerPairingStatus>('idle');
    const [syncMessage, setSyncMessage] = useState('Start sharing when the trainer desktop app is looking for this phone.');
    const [runtimeLabel, setRuntimeLabel] = useState('Checking device...');
    const [canUseNearbySync, setCanUseNearbySync] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const totalCalories = workoutLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);
    const healthConnected = sources.some((source) => source.connected);
    const pairingPayload = useMemo(() => buildTrainerMetricPayload(), [latestSnapshot, workoutLogs.length, refreshKey]);
    const pairingCode = createPairingCode(deviceId ?? pairingPayload.athlete.deviceId);
    const keyMetrics = [
        ['Steps Today', (latestSnapshot?.stepsToday ?? 0).toLocaleString(), Footprints, 'var(--app-secondary)'],
        ['Distance', latestSnapshot?.distanceKmToday ? `${latestSnapshot.distanceKmToday.toFixed(2)} km` : 'Pending', Route, 'var(--app-accent)'],
        ['Active Calories', latestSnapshot?.activeCaloriesToday ? `${latestSnapshot.activeCaloriesToday}` : 'Pending', Flame, '#f97316'],
        ['Readiness', healthConnected ? 'Synced' : 'Local', HeartPulse, 'var(--app-accent)'],
    ] as const;
    const settings: Array<[string, string, LucideIcon, string]> = [
        ['Profile Settings', 'Adjust body metrics, goals, and coaching preferences.', Settings, '/settings/profile'],
        ['App Preferences', 'Change theme, health sync, and local device data.', Settings, '/settings/appearance'],
        ['Health and Privacy', 'Review integrations, permissions, and export controls.', ShieldCheck, '/settings/privacy'],
    ];

    useEffect(() => {
        let cleanup: Array<{ remove: () => Promise<void> }> = [];
        void getTrainerProximityRuntime().then((runtime) => {
            setRuntimeLabel(runtime.label);
            setCanUseNearbySync(runtime.canUseNearbySync);
            if (!runtime.canUseNearbySync) {
                setSyncMessage(runtime.isVirtual
                    ? 'Simulator and desktop previews cannot advertise nearby. Use a physical iPhone for in-person trainer pairing.'
                    : 'Nearby sync will unlock after the iOS app is rebuilt with the local plugin registered.'
                );
            }
        }).catch(() => {
            setRuntimeLabel('Preview runtime');
            setCanUseNearbySync(false);
            setSyncMessage('Nearby sync needs a physical iPhone build.');
        });

        void listenToTrainerProximity((event) => {
            if (event.type === 'invite') {
                setSyncStatus('searching');
                setSyncMessage(`Trainer found ${event.peer ?? 'this phone'}. Confirm on the trainer desktop app.`);
            } else if (event.type === 'connecting') {
                setSyncStatus('searching');
                setSyncMessage(`Connecting to ${event.peer ?? 'trainer desktop'}...`);
            } else if (event.type === 'connected') {
                setSyncStatus('ready');
                setSyncMessage(`Shared metrics with ${event.peer ?? 'trainer desktop'}.`);
            } else if (event.type === 'disconnected') {
                setSyncStatus('idle');
                setSyncMessage('Trainer sync ended. Start sharing again when needed.');
            } else if (event.type === 'error') {
                setSyncStatus('error');
                setSyncMessage(event.message ?? 'Trainer sync could not start.');
            }
        }).then((handles) => {
            cleanup = handles;
        }).catch((error) => {
            setSyncStatus('error');
            setSyncMessage(error instanceof Error ? error.message : 'Trainer sync is unavailable.');
        });

        return () => {
            cleanup.forEach((handle) => void handle.remove());
            void stopTrainerProximityAdvertising().catch(() => undefined);
        };
    }, []);

    const startTrainerSync = async () => {
        const runtime = await getTrainerProximityRuntime();
        setRuntimeLabel(runtime.label);
        setCanUseNearbySync(runtime.canUseNearbySync);
        if (!runtime.canUseNearbySync) {
            setSyncStatus('idle');
            setSyncMessage(runtime.isVirtual
                ? 'Nearby trainer sync is disabled in simulator and desktop previews. Test this on a physical iPhone.'
                : 'Nearby trainer sync is not registered in this iOS build yet. Sync iOS and rebuild.'
            );
            return;
        }

        setSyncStatus('searching');
            setSyncMessage('Step 1 of 2: refreshing watch data before sharing...');
        try {
            await syncHealthSnapshot().catch(() => undefined);
            setSyncMessage('Step 2 of 2: making this device visible to the trainer desktop app...');
            const payload = buildTrainerMetricPayload();
            setRefreshKey((value) => value + 1);
            await startTrainerProximityAdvertising(payload);
            setSyncMessage('Phone is visible. Open the trainer desktop app and press Find Client.');
        } catch (error) {
            setSyncStatus('error');
            setSyncMessage(error instanceof Error ? error.message : 'Trainer sync could not start on this device.');
        }
    };

    const stopTrainerSync = async () => {
        await stopTrainerProximityAdvertising().catch(() => undefined);
        setSyncStatus('idle');
        setSyncMessage('Trainer sync stopped.');
    };

    return (
        <div style={styles.screen}>
            <div style={styles.bg} />
            <main style={styles.main}>
                <header style={styles.hero}>
                    <div style={styles.avatar}><User size={40} /></div>
                    <h1 style={styles.title}>{user?.name || 'Athlete'}</h1>
                    <p style={styles.copy}>{user?.email || 'Cunningham Fitness member'}</p>
                    <span style={styles.device}>Device profile {deviceId ? deviceId.slice(0, 10) : 'local'}</span>
                </header>
                <section style={styles.metrics}>
                    {[
                        ['Training Blocks', workoutLogs.length],
                        ['Calories Burned', totalCalories.toLocaleString()],
                        ['Protocol Status', 'Active'],
                    ].map(([label, value]) => (
                        <article key={label} style={styles.metric}><p style={styles.label}>{label}</p><p style={styles.value}>{value}</p></article>
                    ))}
                </section>
                <section style={styles.keyMetrics}>
                    <div style={styles.sectionHead}>
                        <Activity size={18} color="var(--app-accent)" />
                        <div>
                            <p style={styles.sectionTitle}>Key Metrics</p>
                            <p style={styles.sectionCopy}>{healthConnected ? `Synced from ${sources.find((source) => source.connected)?.name}` : 'Wearable vitals import from Apple Health or Health Connect when available.'}</p>
                        </div>
                    </div>
                    <div style={styles.keyGrid}>
                        {keyMetrics.map(([label, value, Icon, color]) => (
                            <article key={label} style={styles.keyMetric}>
                                <span style={{ ...styles.keyIcon, color: String(color), background: `${String(color)}18` }}>
                                    <Icon size={18} />
                                </span>
                                <span style={styles.keyLabel}>{label}</span>
                                <strong style={styles.keyValue}>{value}</strong>
                            </article>
                        ))}
                    </div>
                </section>
                <section style={styles.syncCard}>
                    <div style={styles.syncHead}>
                        <span style={styles.syncIcon}>{canUseNearbySync ? <Wifi size={21} /> : <Smartphone size={21} />}</span>
                        <div>
                            <p style={styles.sectionTitle}>Trainer Nearby Sync</p>
                            <p style={styles.sectionCopy}>{syncMessage}</p>
                        </div>
                    </div>
                    <div style={styles.syncMeta}>
                        <span style={styles.syncPill}>Pairing code {pairingCode}</span>
                        <span style={styles.syncPill}>{latestSnapshot ? `Health ${latestSnapshot.sourceLabel}` : 'Health not synced'}</span>
                        <span style={styles.syncPill}>{runtimeLabel}</span>
                    </div>
                    <div style={styles.syncActions}>
                        {canUseNearbySync ? (
                            <button type="button" style={styles.primaryButton} onClick={startTrainerSync} disabled={syncStatus === 'searching'}>
                                {syncStatus === 'searching' ? <RefreshCw size={18} /> : <Wifi size={18} />} {syncStatus === 'searching' ? 'Preparing Sync...' : 'Share With Trainer'}
                            </button>
                        ) : null}
                        {syncStatus !== 'idle' && canUseNearbySync ? (
                            <button type="button" style={styles.ghostButton} onClick={stopTrainerSync}><XCircle size={18} /> Stop</button>
                        ) : (
                            <button type="button" style={styles.ghostButton} onClick={() => router.push('/settings/privacy' as never)}><ShieldCheck size={18} /> Health & Privacy</button>
                        )}
                    </div>
                </section>
                {settings.map(([title, copy, Icon, href]) => (
                    <motion.button key={String(title)} type="button" whileTap={{ scale: 0.98 }} style={styles.setting} onClick={() => router.push(String(href) as never)}>
                        <span style={styles.settingIcon}><Icon size={22} /></span>
                        <span><strong style={styles.settingTitle}>{title}</strong><span style={styles.settingCopy}>{copy}</span></span>
                    </motion.button>
                ))}
                <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.signOut} onClick={logout}><LogOut size={18} /> Sign Out</motion.button>
            </main>
        </div>
    );
}

const glass: CSSProperties = { background: 'var(--app-card)', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow)' };
const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100%', color: 'var(--app-text)', background: 'var(--app-bg)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', userSelect: 'none' },
    bg: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 0%, rgba(26,115,232,.10), transparent 30%), radial-gradient(circle at 95% 16%, rgba(0,191,165,.12), transparent 34%)' },
    main: { position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto', padding: '28px 18px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14 },
    hero: { ...glass, borderRadius: 40, padding: 24, textAlign: 'center' },
    avatar: { width: 96, height: 96, borderRadius: 999, margin: '0 auto', background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center' },
    title: { margin: '18px 0 0', color: 'var(--app-text)', fontSize: 34, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.8 },
    copy: { margin: '12px 0 0', color: 'var(--app-muted)', fontSize: 16, lineHeight: 1.45 },
    device: { display: 'inline-flex', marginTop: 16, borderRadius: 999, background: 'var(--app-raised)', color: 'var(--app-muted)', padding: '9px 14px', fontSize: 13, fontWeight: 700 },
    metrics: { display: 'grid', gridTemplateColumns: 'repeat(1,minmax(0,1fr))', gap: 12 },
    metric: { ...glass, borderRadius: 28, padding: 16 },
    label: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    value: { margin: '8px 0 0', color: 'var(--app-text)', fontSize: 23, lineHeight: 1.1, fontWeight: 850, letterSpacing: -0.4 },
    keyMetrics: { ...glass, borderRadius: 32, padding: 18 },
    sectionHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionTitle: { margin: 0, color: 'var(--app-heading)', fontSize: 18, fontWeight: 900, letterSpacing: -0.2 },
    sectionCopy: { margin: '3px 0 0', color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.3, fontWeight: 650 },
    keyGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 },
    keyMetric: { borderRadius: 24, background: 'var(--app-bg)', padding: 13, display: 'grid', gap: 6 },
    keyIcon: { width: 38, height: 38, borderRadius: 999, display: 'grid', placeItems: 'center' },
    keyLabel: { color: 'var(--app-muted)', fontSize: 12, fontWeight: 850 },
    keyValue: { color: 'var(--app-heading)', fontSize: 19, lineHeight: 1.05, fontWeight: 900 },
    syncCard: { ...glass, borderRadius: 26, padding: 16, display: 'grid', gap: 12 },
    syncHead: { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'center' },
    syncIcon: { width: 44, height: 44, borderRadius: 16, background: 'var(--app-gradient-primary)', color: '#ffffff', display: 'grid', placeItems: 'center' },
    syncMeta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    syncPill: { borderRadius: 999, background: 'var(--app-raised)', color: 'var(--app-muted)', border: '1px solid var(--app-border)', padding: '8px 10px', fontSize: 12, fontWeight: 850, textTransform: 'capitalize' },
    syncActions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 },
    primaryButton: { minHeight: 46, border: 0, borderRadius: 999, background: 'var(--app-gradient-primary)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: 'inherit', fontWeight: 900, fontSize: 14 },
    ghostButton: { minHeight: 46, border: '1px solid var(--app-border)', borderRadius: 999, background: 'var(--app-raised)', color: 'var(--app-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: 'inherit', fontWeight: 850 },
    warningText: { margin: 0, color: 'var(--app-muted)', fontSize: 12, lineHeight: 1.35, fontWeight: 650 },
    setting: { ...glass, borderRadius: 28, padding: 16, color: 'var(--app-text)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, font: 'inherit' },
    settingIcon: { width: 48, height: 48, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center', flexShrink: 0 },
    settingTitle: { display: 'block', fontSize: 18, fontWeight: 850, letterSpacing: -0.2 },
    settingCopy: { display: 'block', marginTop: 5, color: 'var(--app-muted)', fontSize: 14, lineHeight: 1.4 },
    signOut: { border: 0, borderRadius: 999, background: 'var(--app-raised)', color: '#334155', minHeight: 48, padding: '0 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: 'inherit', fontWeight: 800 },
};
