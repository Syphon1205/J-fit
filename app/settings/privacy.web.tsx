import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, FileText, HeartPulse, Link, Lock, RefreshCw, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../src/stores/authStore';
import { useChallengesStore } from '../../src/stores/challengesStore';
import { useNutritionStore } from '../../src/stores/nutritionStore';
import { useNotificationsStore } from '../../src/stores/notificationsStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useHealthStore } from '../../src/stores/healthStore';
import { useRunStore } from '../../src/stores/runStore';
import { useSessionStore } from '../../src/stores/sessionStore';
import { useCoachingStore } from '../../src/stores/coachingStore';
import { useWorkoutVideoStore } from '../../src/stores/workoutVideoStore';
import { useRepLogStore } from '../../src/stores/repLogStore';
import { appStorage } from '../../src/utils/Storage';

export default function PrivacySettingsWeb() {
    const router = useRouter();
    const [shareActivity, setShareActivity] = useState(false);
    const [crashReports, setCrashReports] = useState(true);
    const [personalization, setPersonalization] = useState(true);
    const progressReset = useProgressStore((s) => s.reset);
    const workoutReset = useWorkoutStore((s) => s.reset);
    const nutritionReset = useNutritionStore((s) => s.reset);
    const notificationsReset = useNotificationsStore((s) => s.reset);
    const challengesReset = useChallengesStore((s) => s.reset);
    const deleteAccount = useAuthStore((s) => s.deleteAccount);
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
    const currentHealthSource = healthSources.find((source) => source.id === 'apple_health') ?? healthSources[0];
    const healthReset = useHealthStore((s) => s.reset);

    const resetProgress = async () => {
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
        try { window.localStorage.removeItem('cf-dashboard-agenda'); } catch {}
        window.alert('Progress reset complete.');
    };

    const removeAccount = async () => {
        await deleteAccount();
        router.replace('/(auth)/login' as never);
    };

    return (
        <div style={styles.screen}>
            <main style={styles.main}>
                <header style={styles.topBar}>
                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.backButton} onClick={() => router.push('/profile' as never)}>
                        <ArrowLeft size={22} />
                    </motion.button>
                    <strong style={styles.topTitle}>Health and Privacy</strong>
                    <span style={{ width: 52 }} />
                </header>

                <section style={styles.hero}>
                    <span style={styles.heroIcon}><ShieldCheck size={30} /></span>
                    <h1 style={styles.title}>Your data stays yours.</h1>
                    <p style={styles.copy}>Health metrics are stored locally on this device. You control sharing, personalization, and resets.</p>
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}><HeartPulse size={18} /> Health sync</p>
                    <div style={styles.healthHeader}>
                        <span style={{ ...styles.healthIcon, color: currentHealthSource.color, background: `${currentHealthSource.color}18` }}>
                            <HeartPulse size={22} />
                        </span>
                        <span style={styles.actionBody}>
                            <strong style={styles.rowTitle}>{currentHealthSource.name}</strong>
                            <span style={styles.rowCopy}>
                                {currentHealthSource.connected
                                    ? `Connected${currentHealthSource.lastSync ? ` · ${currentHealthSource.lastSync}` : ''}`
                                    : 'Connect watch health data for steps, sleep, heart rate, workouts, and readiness.'}
                            </span>
                        </span>
                    </div>
                    {latestSnapshot ? (
                        <div style={styles.healthGrid}>
                            <span style={styles.healthMetric}><strong>{latestSnapshot.stepsToday.toLocaleString()}</strong><small>Steps</small></span>
                            <span style={styles.healthMetric}><strong>{latestSnapshot.sleepHours ? `${latestSnapshot.sleepHours.toFixed(1)}h` : 'Watch'}</strong><small>Sleep</small></span>
                            <span style={styles.healthMetric}><strong>{latestSnapshot.restingHeartRateBpm ?? 'Watch'}</strong><small>Resting HR</small></span>
                        </div>
                    ) : null}
                    {healthError ? <p style={styles.warning}>{healthError}</p> : null}
                    <button
                        type="button"
                        style={{ ...styles.healthButton, background: currentHealthSource.color }}
                        disabled={currentHealthSource.syncing}
                        onClick={() => currentHealthSource.connected ? void syncHealthNow(currentHealthSource.id) : void requestHealthPermission(currentHealthSource.id)}
                    >
                        {currentHealthSource.connected ? <RefreshCw size={18} /> : <Link size={18} />}
                        {currentHealthSource.syncing ? 'Syncing health data...' : currentHealthSource.connected ? 'Sync Health Now' : `Connect ${currentHealthSource.name}`}
                    </button>
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}><Lock size={18} /> Data sharing</p>
                    <ToggleRow label="Share activity data" copy="Use anonymous training stats to improve recommendations." checked={shareActivity} onChange={setShareActivity} />
                    <ToggleRow label="Crash reports" copy="Send diagnostics when something breaks." checked={crashReports} onChange={setCrashReports} />
                    <ToggleRow label="Personalized coaching" copy="Tune dashboard guidance from workouts and nutrition." checked={personalization} onChange={setPersonalization} />
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}>Data controls</p>
                    <Action icon={<Download size={20} />} title="Request data copy" copy="Prepare a local export summary." onClick={() => window.alert('Local data export summary prepared.')} />
                    <Action icon={<RotateCcw size={20} />} title="Reset progress" copy="Clear workouts, nutrition logs, and trends." onClick={resetProgress} tone="warning" />
                    <Action icon={<Trash2 size={20} />} title="Delete account" copy="Sign out and clear the local account on this device." onClick={removeAccount} tone="danger" />
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}>Privacy Policy</p>
                    <Action icon={<FileText size={20} />} title="Read full Privacy Policy" copy="Open the complete Cunningham Fitness Privacy Policy." onClick={() => router.push('/settings/privacy-policy' as never)} />
                </section>
            </main>
        </div>
    );
}

function ToggleRow({ label, copy, checked, onChange }: { label: string; copy: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <div style={styles.row}>
            <div>
                <p style={styles.rowTitle}>{label}</p>
                <p style={styles.rowCopy}>{copy}</p>
            </div>
            <motion.button type="button" whileTap={{ scale: 0.94 }} style={checked ? styles.switchOn : styles.switchOff} onClick={() => onChange(!checked)}>
                <span style={checked ? styles.knobOn : styles.knobOff} />
            </motion.button>
        </div>
    );
}

function Action({ icon, title, copy, onClick, tone = 'blue' }: { icon: ReactNode; title: string; copy: string; onClick: () => void | Promise<void>; tone?: 'blue' | 'warning' | 'danger' }) {
    const color = tone === 'danger' ? '#dc2626' : tone === 'warning' ? '#d97706' : 'var(--app-accent)';
    return (
        <motion.button type="button" whileTap={{ scale: 0.98 }} style={styles.action} onClick={() => void onClick()}>
            <span style={{ ...styles.actionIcon, color, background: `${color}14` }}>{icon}</span>
            <span style={styles.actionBody}>
                <strong style={{ ...styles.rowTitle, color }}>{title}</strong>
                <span style={styles.rowCopy}>{copy}</span>
            </span>
        </motion.button>
    );
}

const card: CSSProperties = { background: 'var(--app-card)', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow)', borderRadius: 32 };
const styles: Record<string, CSSProperties> = {
    screen: { height: '100dvh', minHeight: '100dvh', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', background: 'var(--app-bg)', color: 'var(--app-text)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', WebkitOverflowScrolling: 'touch' },
    main: { width: '100%', maxWidth: 760, margin: '0 auto', padding: 'max(92px, calc(env(safe-area-inset-top) + 42px)) 16px calc(env(safe-area-inset-bottom) + 128px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 },
    topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { width: 52, height: 52, borderRadius: 999, border: 0, background: 'var(--app-card)', color: 'var(--app-text)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(15,23,42,.08)' },
    topTitle: { color: 'var(--app-heading)', fontSize: 18, fontWeight: 850 },
    hero: { ...card, padding: 22, textAlign: 'center' },
    heroIcon: { width: 78, height: 78, borderRadius: 999, margin: '0 auto', background: 'var(--app-accent-soft)', color: 'var(--app-secondary)', display: 'grid', placeItems: 'center' },
    title: { margin: '16px 0 0', color: 'var(--app-heading)', fontSize: 30, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.7 },
    copy: { margin: '8px auto 0', maxWidth: 460, color: 'var(--app-muted)', fontSize: 15, lineHeight: 1.45 },
    card: { ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
    sectionTitle: { margin: '0 0 4px', color: 'var(--app-heading)', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 850 },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderRadius: 24, background: 'var(--app-bg)', padding: 14 },
    rowTitle: { display: 'block', margin: 0, color: 'var(--app-heading)', fontSize: 16, fontWeight: 850, letterSpacing: -0.2 },
    rowCopy: { display: 'block', marginTop: 4, color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.35 },
    switchOn: { width: 54, height: 32, border: 0, borderRadius: 999, background: 'var(--app-accent)', padding: 3, flexShrink: 0 },
    switchOff: { width: 54, height: 32, border: 0, borderRadius: 999, background: 'var(--app-muted-surface)', padding: 3, flexShrink: 0 },
    knobOn: { display: 'block', width: 26, height: 26, borderRadius: 999, background: 'var(--app-card)', marginLeft: 22 },
    knobOff: { display: 'block', width: 26, height: 26, borderRadius: 999, background: 'var(--app-card)' },
    action: { border: 0, borderRadius: 24, background: 'var(--app-bg)', padding: 14, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, font: 'inherit' },
    actionIcon: { width: 46, height: 46, borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0 },
    actionBody: { minWidth: 0 },
    healthHeader: { display: 'flex', alignItems: 'center', gap: 12, borderRadius: 24, background: 'var(--app-bg)', padding: 14 },
    healthIcon: { width: 48, height: 48, borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0 },
    healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 },
    healthMetric: { borderRadius: 20, background: 'var(--app-bg)', padding: 12, display: 'grid', gap: 3 },
    healthButton: { minHeight: 48, border: 0, borderRadius: 999, color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: 'inherit', fontWeight: 900 },
    warning: { margin: 0, borderRadius: 18, background: 'rgba(245,158,11,.12)', color: '#d97706', padding: 12, fontSize: 13, lineHeight: 1.4, fontWeight: 700 },
    policyIntro: { margin: 0, color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.45 },
    policyBlock: { borderRadius: 20, background: 'var(--app-bg)', padding: 13, display: 'grid', gap: 4 },
    policyTitle: { color: 'var(--app-heading)', fontSize: 14, fontWeight: 900 },
};
