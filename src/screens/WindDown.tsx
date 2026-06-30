import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { ArrowLeft, HeartPulse, Moon, Watch, Zap } from 'lucide-react';
import { useHealthStore } from '../stores/healthStore';

export default function WindDown() {
    const router = useRouter();
    const latestSnapshot = useHealthStore((state) => state.latestSnapshot);
    const sources = useHealthStore((state) => state.sources);
    const syncHealthSnapshot = useHealthStore((state) => state.syncHealthSnapshot);
    const connectedSource = sources.find((source) => source.connected);
    const sleepHours = latestSnapshot?.sleepHours;
    const sourceLabel = connectedSource?.name ?? latestSnapshot?.sourceLabel ?? 'watch health sync';
    const syncTime = latestSnapshot?.syncedAt
        ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(latestSnapshot.syncedAt))
        : 'Not synced yet';
    const sleepStatus = sleepHours
        ? sleepHours >= 7 ? 'Recovered' : sleepHours >= 6 ? 'Light sleep debt' : 'Needs recovery'
        : connectedSource ? 'Waiting for sleep import' : 'Awaiting wearable import';

    useEffect(() => {
        void syncHealthSnapshot().catch(() => undefined);
    }, [syncHealthSnapshot]);

    const metrics = [
        ['Sleep', sleepHours ? `${sleepHours.toFixed(1)} hr` : 'Pending', 'Last sleep sample from Health', Moon, '#8b5cf6'],
        ['Resting HR', latestSnapshot?.restingHeartRateBpm ? `${latestSnapshot.restingHeartRateBpm} bpm` : 'Pending', 'Night recovery baseline', HeartPulse, 'var(--app-accent)'],
        ['HRV', latestSnapshot?.hrvMs ? `${latestSnapshot.hrvMs} ms` : 'Pending', 'Recovery readiness signal', Zap, 'var(--app-secondary)'],
    ] as const;

    return (
        <div style={styles.screen}>
            <main style={styles.main}>
                <header style={styles.topBar}>
                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.backButton} onClick={() => router.push('/' as never)}>
                        <ArrowLeft size={22} />
                    </motion.button>
                    <div>
                        <p style={styles.kicker}>Watch recovery</p>
                        <h1 style={styles.title}>Sleep</h1>
                    </div>
                </header>

                <section style={styles.heroCard}>
                    <span style={styles.heroIcon}><Moon size={26} /></span>
                    <h2 style={styles.heroTitle}>{sleepStatus}</h2>
                    <p style={styles.copy}>
                        Sleep, HRV, and resting heart rate should come straight from Apple Health or Health Connect once your watch syncs.
                    </p>
                    <div style={styles.syncPill}>
                        <Watch size={16} />
                        <span>{sourceLabel} · {syncTime}</span>
                    </div>
                </section>

                <section style={styles.card}>
                    <div style={styles.sectionHeader}>
                        <p style={styles.cardTitle}>Recovery metrics</p>
                        <button type="button" style={styles.syncButton} onClick={() => void syncHealthSnapshot()}>Sync</button>
                    </div>
                    <div style={styles.metricGrid}>
                        {metrics.map(([label, value, detail, Icon, color]) => (
                            <article key={label} style={styles.metric}>
                                <span style={{ ...styles.metricIcon, color: String(color), background: `${String(color)}18` }}>
                                    <Icon size={19} />
                                </span>
                                <strong style={styles.metricValue}>{value}</strong>
                                <span style={styles.metricLabel}>{label}</span>
                                <small style={styles.metricDetail}>{detail}</small>
                            </article>
                        ))}
                    </div>
                </section>

                <section style={styles.breathCard}>
                    <p style={styles.cardTitle}>Tonight’s guidance</p>
                    <p style={styles.copy}>
                        {sleepHours
                            ? sleepHours < 6.5
                                ? 'Keep tomorrow easier until your watch shows stronger sleep and recovery trends.'
                                : 'You have a usable sleep base. Let HRV and resting heart rate decide how hard to push.'
                            : 'Sleep data imports from the wearable health snapshot when permissions and device data are available.'}
                    </p>
                </section>
            </main>
        </div>
    );
}

const card: CSSProperties = {
    background: 'var(--app-card)',
    border: '1px solid var(--app-border)',
    boxShadow: 'var(--app-shadow)',
    borderRadius: 32,
};

const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100%', background: 'var(--app-bg)', color: 'var(--app-text)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', userSelect: 'none' },
    main: { width: '100%', maxWidth: 820, margin: '0 auto', padding: '18px 16px 32px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 },
    topBar: { display: 'flex', alignItems: 'center', gap: 14 },
    backButton: { width: 52, height: 52, borderRadius: 999, border: 0, background: 'var(--app-card)', color: 'var(--app-text)', display: 'grid', placeItems: 'center', boxShadow: 'var(--app-shadow)' },
    kicker: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 750 },
    title: { margin: '4px 0 0', color: 'var(--app-heading)', fontSize: 34, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.8 },
    heroCard: { ...card, padding: 22, background: 'linear-gradient(135deg,var(--app-card),var(--app-accent-soft))' },
    heroIcon: { width: 62, height: 62, borderRadius: 999, background: 'var(--app-accent-soft)', color: '#8b5cf6', display: 'grid', placeItems: 'center' },
    heroTitle: { margin: '16px 0 0', color: 'var(--app-heading)', fontSize: 28, lineHeight: 1.1, fontWeight: 850, letterSpacing: -0.6 },
    copy: { margin: '8px 0 0', color: 'var(--app-muted)', fontSize: 15, lineHeight: 1.45 },
    card: { ...card, padding: 18 },
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    cardTitle: { margin: 0, color: 'var(--app-heading)', fontSize: 19, fontWeight: 850, letterSpacing: -0.2 },
    syncPill: { marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, borderRadius: 999, padding: '0 13px', background: 'var(--app-bg)', color: 'var(--app-heading)', fontSize: 13, fontWeight: 850 },
    syncButton: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 38, padding: '0 14px', font: 'inherit', fontWeight: 850 },
    metricGrid: { marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 },
    metric: { borderRadius: 24, background: 'var(--app-bg)', padding: 14, display: 'grid', gap: 6 },
    metricIcon: { width: 38, height: 38, borderRadius: 999, display: 'grid', placeItems: 'center' },
    metricValue: { color: 'var(--app-heading)', fontSize: 22, lineHeight: 1.05, fontWeight: 900 },
    metricLabel: { color: 'var(--app-text)', fontSize: 13, fontWeight: 850 },
    metricDetail: { color: 'var(--app-muted)', fontSize: 12, lineHeight: 1.3, fontWeight: 650 },
    breathCard: { ...card, padding: 22, textAlign: 'center' },
};
