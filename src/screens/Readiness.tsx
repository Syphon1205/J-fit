import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Activity, ArrowLeft, Flame, Footprints, HeartPulse, Route } from 'lucide-react';
import { useHealthStore } from '../stores/healthStore';
import { useProgressStore } from '../stores/progressStore';

const sentimentOptions = [
    { id: 'crushed', label: 'Feeling Crushed', scoreDelta: -18 },
    { id: 'standard', label: 'Standard', scoreDelta: 0 },
    { id: 'pr', label: 'Ready to PR', scoreDelta: 8 },
] as const;

type SentimentId = typeof sentimentOptions[number]['id'];

export default function Readiness() {
    const router = useRouter();
    const [sentiment, setSentiment] = useState<SentimentId>('standard');
    const latestSnapshot = useHealthStore((state) => state.latestSnapshot);
    const sources = useHealthStore((state) => state.sources);
    const weeklyWorkoutMinutes = useProgressStore((state) => state.weeklyWorkoutMinutes);
    const weeklySteps = useProgressStore((state) => state.weeklySteps);
    const activeSource = sources.find((source) => source.connected);

    const baseRecovery = useMemo(() => {
        const todaySteps = latestSnapshot?.stepsToday ?? weeklySteps[weeklySteps.length - 1] ?? 0;
        const weeklyMinutes = weeklyWorkoutMinutes.reduce((sum, value) => sum + value, 0);
        const movementScore = Math.min(32, Math.round((todaySteps / 9000) * 32));
        const trainingScore = Math.min(34, Math.round((weeklyMinutes / 150) * 34));
        return Math.min(96, 38 + movementScore + trainingScore);
    }, [latestSnapshot?.stepsToday, weeklySteps, weeklyWorkoutMinutes]);

    const selected = sentimentOptions.find((option) => option.id === sentiment) ?? sentimentOptions[1];
    const recoveryScore = Math.max(12, Math.min(99, baseRecovery + selected.scoreDelta));
    const sourceLabel = activeSource?.name ?? latestSnapshot?.sourceLabel ?? 'Device motion';
    const syncTime = latestSnapshot?.syncedAt
        ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(latestSnapshot.syncedAt))
        : 'Not synced yet';

    const lockIn = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {
            // Haptics are native-only.
        }
        router.push('/workouts' as never);
    };

    const metrics = [
        ['Steps', (latestSnapshot?.stepsToday ?? 0).toLocaleString(), Footprints, 'var(--app-secondary)'],
        ['Distance', latestSnapshot?.distanceKmToday ? `${latestSnapshot.distanceKmToday.toFixed(2)} km` : 'Pending', Route, 'var(--app-accent)'],
        ['Active burn', latestSnapshot?.activeCaloriesToday ? `${latestSnapshot.activeCaloriesToday} kcal` : 'Pending', Flame, '#f97316'],
        ['Recovery', `${recoveryScore}%`, HeartPulse, 'var(--app-accent)'],
    ] as const;

    return (
        <div style={styles.screen}>
            <div style={styles.bg} />
            <main style={styles.main}>
                <header style={styles.topBar}>
                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.backButton} onClick={() => router.back()}>
                        <ArrowLeft size={22} />
                    </motion.button>
                    <strong style={styles.topTitle}>Readiness</strong>
                    <span style={{ width: 52 }} />
                </header>

                <section style={styles.hero}>
                    <p style={styles.kicker}>Readiness Check</p>
                    <h1 style={styles.title}>Dial in your intensity before you move.</h1>
                    <p style={styles.copy}>
                        {sourceLabel} shows your current activity profile. Choose how you feel so today’s session hits the right edge.
                    </p>
                </section>

                <section style={styles.scoreCard}>
                    <div>
                        <p style={styles.label}>Recovery Score</p>
                        <p style={styles.score}>{recoveryScore}%</p>
                        <p style={styles.meta}>Synced from {sourceLabel} · {syncTime}</p>
                    </div>
                    <span style={styles.badge}>Performance Window</span>
                </section>

                <section style={styles.card}>
                    <div style={styles.sectionHead}>
                        <Activity size={18} color="var(--app-accent)" />
                        <h2 style={styles.sectionTitle}>Key metrics</h2>
                    </div>
                    <div style={styles.metricsGrid}>
                        {metrics.map(([label, value, Icon, color]) => (
                            <article key={label} style={styles.metric}>
                                <span style={{ ...styles.metricIcon, color: String(color), background: `${String(color)}18` }}>
                                    <Icon size={18} />
                                </span>
                                <span style={styles.metricLabel}>{label}</span>
                                <strong style={styles.metricValue}>{value}</strong>
                            </article>
                        ))}
                    </div>
                </section>

                <section style={styles.card}>
                    <p style={styles.label}>How are you feeling?</p>
                    <div style={styles.choiceGrid}>
                        {sentimentOptions.map((option) => (
                            <motion.button
                                key={option.id}
                                type="button"
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                                onClick={() => setSentiment(option.id)}
                                style={sentiment === option.id ? styles.choiceActive : styles.choice}
                            >
                                {option.label}
                            </motion.button>
                        ))}
                    </div>
                </section>

                <section style={styles.card}>
                    <p style={styles.label}>Coach Signal</p>
                    <p style={styles.coachTitle}>{sentiment === 'crushed' ? 'Pull the throttle back and protect recovery.' : sentiment === 'pr' ? 'Your signal supports a hard top set.' : 'Your nervous system looks ready for standard progression.'}</p>
                    <p style={styles.meta}>Auto-adjustments will respect your selection: {selected.label}.</p>
                </section>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    onClick={lockIn}
                    style={styles.primary}
                >
                    Lock In & Start Training
                </motion.button>
            </main>
        </div>
    );
}

const card: CSSProperties = {
    background: 'var(--app-card)',
    border: '1px solid var(--app-border)',
    boxShadow: 'var(--app-shadow)',
};

const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100%', background: 'var(--app-bg)', color: 'var(--app-text)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', userSelect: 'none' },
    bg: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 18% 0%, var(--app-accent-soft), transparent 32%), radial-gradient(circle at 90% 12%, rgba(0,191,165,.12), transparent 34%)' },
    main: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 780, margin: '0 auto', padding: 'max(84px, calc(env(safe-area-inset-top) + 34px)) 16px calc(env(safe-area-inset-bottom) + 120px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14 },
    topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    backButton: { border: 0, width: 52, height: 52, borderRadius: 999, background: 'var(--app-card)', color: 'var(--app-text)', display: 'grid', placeItems: 'center', boxShadow: 'var(--app-shadow)' },
    topTitle: { color: 'var(--app-heading)', fontSize: 18, fontWeight: 900 },
    hero: { display: 'grid', gap: 8, padding: '4px 2px 2px' },
    kicker: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 800 },
    title: { margin: 0, color: 'var(--app-heading)', fontSize: 34, lineHeight: 1.04, fontWeight: 900, letterSpacing: -1 },
    copy: { margin: 0, maxWidth: 620, color: 'var(--app-muted)', fontSize: 15, lineHeight: 1.45, fontWeight: 650 },
    scoreCard: { ...card, borderRadius: 32, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
    label: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 850 },
    score: { margin: '8px 0 0', color: 'var(--app-heading)', fontSize: 44, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2 },
    meta: { margin: '8px 0 0', color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.4, fontWeight: 650 },
    badge: { borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: '9px 12px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' },
    card: { ...card, borderRadius: 30, padding: 16 },
    sectionHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { margin: 0, color: 'var(--app-heading)', fontSize: 18, fontWeight: 900, letterSpacing: -0.2 },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 },
    metric: { borderRadius: 24, background: 'var(--app-bg)', padding: 13, display: 'grid', gap: 6, minWidth: 0 },
    metricIcon: { width: 38, height: 38, borderRadius: 999, display: 'grid', placeItems: 'center' },
    metricLabel: { color: 'var(--app-muted)', fontSize: 12, fontWeight: 850 },
    metricValue: { color: 'var(--app-heading)', fontSize: 19, lineHeight: 1.05, fontWeight: 900 },
    choiceGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 12 },
    choice: { border: 0, borderRadius: 999, background: 'var(--app-bg)', color: 'var(--app-muted)', minHeight: 44, padding: '0 10px', font: 'inherit', fontSize: 13, fontWeight: 850 },
    choiceActive: { border: 0, borderRadius: 999, background: 'var(--app-text)', color: 'var(--app-bg)', minHeight: 44, padding: '0 10px', font: 'inherit', fontSize: 13, fontWeight: 900 },
    coachTitle: { margin: '9px 0 0', color: 'var(--app-heading)', fontSize: 18, lineHeight: 1.3, fontWeight: 850 },
    primary: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 54, padding: '0 18px', font: 'inherit', fontSize: 16, fontWeight: 900, boxShadow: '0 16px 34px rgba(15,23,42,.14)' },
};
