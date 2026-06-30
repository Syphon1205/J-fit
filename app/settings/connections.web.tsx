import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { useRouter } from 'expo-router';
import { Activity, ArrowLeft, CheckCircle2, Flame, Footprints, HeartPulse, Moon, RefreshCw, Route, ShieldCheck, Smartphone } from 'lucide-react';
import { useHealthStore, type HealthDataType } from '../../src/stores/healthStore';

const categoryLabels: Record<HealthDataType['category'], string> = {
    activity: 'Activity',
    body: 'Body',
    sleep: 'Sleep',
    vitals: 'Vitals',
};

function metricValue(value: number | undefined | null, suffix = '') {
    if (value === undefined || value === null || Number.isNaN(value)) return 'Not synced';
    return `${typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}${suffix}`;
}

export default function HealthConnectionsWeb() {
    const router = useRouter();
    const { sources, dataTypes, latestSnapshot, lastError, requestPermission, syncNow, toggleDataType, disconnect } = useHealthStore();
    const platform = Capacitor.getPlatform();
    const [runtime, setRuntime] = useState({ checked: false, isVirtual: platform !== 'ios' && platform !== 'android', label: 'Checking device...' });
    const source = useMemo(() => {
        const sourceId = platform === 'android' ? 'google_health' : 'apple_health';
        return sources.find((item) => item.id === sourceId) ?? sources[0];
    }, [platform, sources]);
    const connected = Boolean(source?.connected);
    const syncing = Boolean(source?.syncing);
    const canConnect = Capacitor.isNativePlatform() && !runtime.isVirtual;
    const grouped = useMemo(() => {
        return dataTypes.reduce<Record<string, HealthDataType[]>>((acc, item) => {
            acc[item.category] = [...(acc[item.category] ?? []), item];
            return acc;
        }, {});
    }, [dataTypes]);

    const metrics = [
        ['Steps', latestSnapshot?.stepsToday ? latestSnapshot.stepsToday.toLocaleString() : 'Not synced', Footprints],
        ['Distance', latestSnapshot?.distanceKmToday ? `${latestSnapshot.distanceKmToday.toFixed(2)} km` : 'Not synced', Route],
        ['Active kcal', metricValue(latestSnapshot?.activeCaloriesToday), Flame],
        ['Sleep', latestSnapshot?.sleepHours ? `${latestSnapshot.sleepHours.toFixed(1)} hr` : 'Not synced', Moon],
        ['Resting HR', latestSnapshot?.restingHeartRateBpm ? `${Math.round(latestSnapshot.restingHeartRateBpm)} bpm` : 'Not synced', HeartPulse],
        ['HRV', latestSnapshot?.hrvMs ? `${Math.round(latestSnapshot.hrvMs)} ms` : 'Not synced', Activity],
    ] as const;

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            setRuntime({ checked: true, isVirtual: true, label: 'Web preview' });
            return;
        }
        void Device.getInfo().then((info) => {
            setRuntime({
                checked: true,
                isVirtual: Boolean(info.isVirtual),
                label: info.isVirtual ? 'Simulator preview' : `${info.manufacturer} ${info.model}`,
            });
        }).catch(() => {
            setRuntime({ checked: true, isVirtual: true, label: 'Preview runtime' });
        });
    }, []);

    const connect = () => {
        if (!source || syncing || !canConnect) return;
        void requestPermission(source.id);
    };

    const sync = () => {
        if (!source || syncing) return;
        void syncNow(source.id);
    };

    const disconnectSource = () => {
        if (!source || syncing) return;
        disconnect(source.id);
    };

    return (
        <main style={styles.screen}>
            <div style={styles.bg} />
            <section style={styles.shell}>
                <header style={styles.topbar}>
                    <button type="button" style={styles.iconButton} onClick={() => router.back()} aria-label="Back">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={styles.title}>Health & Data</h1>
                        <p style={styles.subtitle}>
                            {platform === 'android'
                                ? 'Use Health Connect for watch workouts, steps, sleep, and vitals.'
                                : 'Use Apple Health for watch workouts, steps, sleep, and vitals.'}
                        </p>
                    </div>
                </header>

                <section style={styles.hero}>
                    <div style={styles.heroIcon}><Smartphone size={26} /></div>
                    <div style={styles.heroBody}>
                        <p style={styles.kicker}>Device health sync</p>
                        <h2 style={styles.heroTitle}>{source?.name ?? 'Device Health'}</h2>
                        <p style={styles.heroCopy}>
                            {!canConnect
                                ? `${runtime.label}: real watch health sync requires a physical ${platform === 'android' ? 'Android device' : 'iPhone'}.`
                                : connected
                                ? `Connected${source?.lastSync ? ` · ${source.lastSync}` : ''}. Sync again before pairing with a trainer.`
                                : 'Connect once, then your watch data can flow into the dashboard and trainer review.'}
                        </p>
                    </div>
                    <div style={styles.heroActions}>
                        <button type="button" style={styles.primaryButton} onClick={connected ? sync : connect} disabled={syncing || !canConnect}>
                            {syncing ? <RefreshCw size={17} className="spin" /> : connected ? <RefreshCw size={17} /> : <ShieldCheck size={17} />}
                            {syncing ? 'Working...' : connected ? 'Sync Now' : canConnect ? 'Connect' : 'Physical Device Required'}
                        </button>
                        {connected ? (
                            <button type="button" style={styles.secondaryButton} onClick={disconnectSource}>Disconnect</button>
                        ) : null}
                    </div>
                </section>

                {lastError ? (
                    <div style={styles.errorBanner}>
                        <strong>Sync needs attention</strong>
                        <span>{lastError}</span>
                    </div>
                ) : null}

                <section style={styles.metricsGrid}>
                    {metrics.map(([label, value, Icon]) => (
                        <article key={label} style={styles.metricCard}>
                            <Icon size={18} color="var(--app-accent)" />
                            <span style={styles.metricLabel}>{label}</span>
                            <strong style={styles.metricValue}>{value}</strong>
                        </article>
                    ))}
                </section>

                <section style={styles.card}>
                    <div style={styles.sectionHead}>
                        <div>
                            <p style={styles.sectionTitle}>Data Permissions</p>
                            <p style={styles.sectionCopy}>Choose what Cunningham Fitness asks the device health system to read.</p>
                        </div>
                        <span style={styles.statusPill}><CheckCircle2 size={15} /> {dataTypes.filter((item) => item.enabled).length}/{dataTypes.length}</span>
                    </div>
                    <div style={styles.permissionGroups}>
                        {Object.entries(grouped).map(([category, items]) => (
                            <div key={category} style={styles.permissionGroup}>
                                <p style={styles.groupTitle}>{categoryLabels[category as HealthDataType['category']] ?? category}</p>
                                {items.map((item) => (
                                    <label key={item.id} style={styles.permissionRow}>
                                        <input
                                            type="checkbox"
                                            checked={item.enabled}
                                            onChange={() => toggleDataType(item.id)}
                                            style={styles.checkbox}
                                        />
                                        <span>
                                            <strong style={styles.permissionTitle}>{item.name}</strong>
                                            <span style={styles.permissionCopy}>{item.description}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}

const glass: CSSProperties = {
    background: 'var(--app-card)',
    border: '1px solid var(--app-border)',
    boxShadow: 'var(--app-shadow)',
};

const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100%', color: 'var(--app-text)', background: 'var(--app-bg)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased' },
    bg: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 12% 0%, rgba(255,45,85,.18), transparent 28%), radial-gradient(circle at 90% 10%, rgba(0,191,165,.14), transparent 32%)' },
    shell: { position: 'relative', zIndex: 1, width: 'min(920px, 100%)', margin: '0 auto', padding: '22px 16px 34px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14 },
    topbar: { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', alignItems: 'center', gap: 12 },
    iconButton: { width: 44, height: 44, borderRadius: 999, border: '1px solid var(--app-border)', background: 'var(--app-card)', color: 'var(--app-text)', display: 'grid', placeItems: 'center' },
    title: { margin: 0, color: 'var(--app-heading)', fontSize: 30, lineHeight: 1, fontWeight: 900, letterSpacing: 0 },
    subtitle: { margin: '7px 0 0', color: 'var(--app-muted)', fontSize: 14, lineHeight: 1.35, fontWeight: 650 },
    hero: { ...glass, borderRadius: 30, padding: 18, display: 'grid', gridTemplateColumns: '54px minmax(0,1fr)', gap: 14 },
    heroIcon: { width: 54, height: 54, borderRadius: 18, display: 'grid', placeItems: 'center', color: 'var(--app-accent)', background: 'var(--app-accent-soft)' },
    heroBody: { minWidth: 0 },
    kicker: { margin: 0, color: 'var(--app-accent)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 },
    heroTitle: { margin: '5px 0 0', color: 'var(--app-heading)', fontSize: 25, lineHeight: 1.05, fontWeight: 900, letterSpacing: 0 },
    heroCopy: { margin: '8px 0 0', color: 'var(--app-muted)', fontSize: 14, lineHeight: 1.45, fontWeight: 650 },
    heroActions: { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 10 },
    primaryButton: { minHeight: 52, border: 0, borderRadius: 999, background: 'var(--app-gradient-primary)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, font: 'inherit', fontWeight: 900, fontSize: 16 },
    secondaryButton: { minHeight: 48, border: '1px solid var(--app-border)', borderRadius: 999, background: 'var(--app-raised)', color: 'var(--app-text)', font: 'inherit', fontWeight: 850 },
    errorBanner: { borderRadius: 22, padding: 14, color: 'var(--app-text)', background: 'rgba(245,158,11,.14)', border: '1px solid rgba(245,158,11,.28)', display: 'grid', gap: 5, fontSize: 14, lineHeight: 1.35 },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 },
    metricCard: { ...glass, borderRadius: 24, padding: 14, minHeight: 112, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' },
    metricLabel: { color: 'var(--app-muted)', fontSize: 12, fontWeight: 850 },
    metricValue: { color: 'var(--app-heading)', fontSize: 22, lineHeight: 1.05, fontWeight: 900, letterSpacing: 0 },
    card: { ...glass, borderRadius: 30, padding: 16 },
    sectionHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
    sectionTitle: { margin: 0, color: 'var(--app-heading)', fontSize: 20, fontWeight: 900, letterSpacing: 0 },
    sectionCopy: { margin: '5px 0 0', color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.35, fontWeight: 650 },
    statusPill: { flexShrink: 0, minHeight: 34, padding: '0 11px', borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 900 },
    permissionGroups: { display: 'grid', gap: 12 },
    permissionGroup: { borderRadius: 22, background: 'var(--app-bg)', border: '1px solid var(--app-border)', padding: 12 },
    groupTitle: { margin: '0 0 10px', color: 'var(--app-heading)', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 },
    permissionRow: { display: 'grid', gridTemplateColumns: '24px minmax(0,1fr)', gap: 10, alignItems: 'start', padding: '10px 0', color: 'var(--app-text)' },
    checkbox: { width: 18, height: 18, accentColor: 'var(--app-accent)', marginTop: 2 },
    permissionTitle: { display: 'block', color: 'var(--app-heading)', fontSize: 15, fontWeight: 850 },
    permissionCopy: { display: 'block', marginTop: 3, color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.35, fontWeight: 600 },
};
