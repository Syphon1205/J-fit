import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Footprints, Plus, Scale, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProgressStore } from '../stores/progressStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useAuthStore } from '../stores/authStore';
import { useHealthStore } from '../stores/healthStore';
import { useThemeStore } from '../stores/themeStore';
import { mediumImpact } from '../utils/haptics';

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const kgToLb = (value: number) => Math.round(value * 2.20462 * 10) / 10;
const lbToKg = (value: number) => Math.round((value / 2.20462) * 10) / 10;

export default function Progress() {
    const user = useAuthStore((state) => state.user);
    const updateProfile = useAuthStore((state) => state.updateProfile);
    const { weightHistory, weeklySteps, weeklyWorkoutMinutes, weeklyCalories, addWeight } = useProgressStore();
    const latestSnapshot = useHealthStore((state) => state.latestSnapshot);
    const lastError = useHealthStore((state) => state.lastError);
    const syncHealthSnapshot = useHealthStore((state) => state.syncHealthSnapshot);
    const units = useThemeStore((state) => state.units);
    const { workoutLogs } = useWorkoutStore();
    const [deltaAmount, setDeltaAmount] = useState(units === 'imperial' ? 1 : 0.5);

    useEffect(() => {
        void syncHealthSnapshot();
    }, [syncHealthSnapshot]);

    const profileWeightKg = user?.weight ?? 76;
    const profileGoalWeightKg = user?.goalWeight;
    const historyKg = weightHistory.length ? weightHistory.slice(-7).map((item) => item.value) : [profileWeightKg];
    const values = historyKg.map((value) => units === 'imperial' ? kgToLb(value) : value);
    const data = labels.map((day, index) => ({ day, weight: values[index] ?? values[values.length - 1] }));
    const latest = data[data.length - 1].weight;
    const delta = latest - data[0].weight;
    const unitLabel = units === 'imperial' ? 'lb' : 'kg';
    const goalDisplay = profileGoalWeightKg ? (units === 'imperial' ? kgToLb(profileGoalWeightKg) : profileGoalWeightKg) : null;
    const todaySteps = latestSnapshot?.stepsToday ?? weeklySteps[weeklySteps.length - 1] ?? 0;
    const weeklyStepTotal = weeklySteps.reduce((sum, value) => sum + value, 0);
    const workoutMinutes = weeklyWorkoutMinutes.reduce((sum, value) => sum + value, 0);
    const activeCalories = latestSnapshot?.activeCaloriesToday ?? weeklyCalories[weeklyCalories.length - 1];
    const metrics: Array<[string, string | number, LucideIcon, string]> = [
        ['Logged Sessions', workoutLogs.length, Activity, 'var(--app-accent)'],
        ['Steps Today', todaySteps.toLocaleString(), Footprints, 'var(--app-secondary)'],
        ['Weekly Steps', weeklyStepTotal.toLocaleString(), TrendingUp, 'var(--app-secondary)'],
        ['Workout Minutes', `${workoutMinutes} min`, Activity, 'var(--app-accent)'],
        ['Active Burn', activeCalories ? `${activeCalories} kcal` : 'Pending', TrendingUp, 'var(--app-accent)'],
        ['Trend Signal', delta <= 0 ? 'Leaning out' : 'Massing', Scale, 'var(--app-accent)'],
    ];

    const logWeightDelta = (direction: 'lost' | 'gained') => {
        void mediumImpact();
        const cleanAmount = Number.isFinite(deltaAmount) && deltaAmount > 0 ? deltaAmount : (units === 'imperial' ? 1 : 0.5);
        const step = units === 'imperial' ? lbToKg(cleanAmount) : cleanAmount;
        const currentKg = weightHistory.at(-1)?.value ?? profileWeightKg;
        const nextKg = Math.max(1, Math.round((currentKg + (direction === 'gained' ? step : -step)) * 10) / 10);
        addWeight({ date: new Date().toISOString().split('T')[0], value: nextKg });
        updateProfile({ weight: nextKg });
    };

    return (
        <div style={styles.screen}>
            <div style={styles.bg} />
            <main style={styles.main}>
                <h1 style={styles.title}>Progress</h1>
                <p style={styles.copy}>Biometric Readiness, trend weight, and workload momentum in one coaching view.</p>

                <section style={styles.card}>
                    <div style={styles.row}>
                        <div>
                            <p style={styles.label}>Weight trend</p>
                            <h2 style={styles.big}>{latest.toFixed(1)} {unitLabel}</h2>
                            <p style={styles.goalText}>{goalDisplay ? `Goal ${goalDisplay.toFixed(1)} ${unitLabel}` : 'Set a goal weight in Profile Settings'}</p>
                        </div>
                        <span style={styles.delta}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)} {unitLabel}</span>
                    </div>
                    <div style={styles.chart}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                                <defs><linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--app-accent)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--app-accent)" stopOpacity={0.02} /></linearGradient></defs>
                                <CartesianGrid stroke="var(--app-border)" vertical={false} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
                                <Tooltip contentStyle={{ background: 'var(--app-card)', border: '1px solid var(--app-border)', borderRadius: 18, color: 'var(--app-text)', boxShadow: '0 12px 32px rgba(15,23,42,.10)' }} />
                                <Area type="monotone" dataKey="weight" stroke="var(--app-accent)" strokeWidth={4} fill="url(#progressFill)" dot={{ r: 4, fill: 'var(--app-accent)', strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={styles.actions}>
                        <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.lossButton} onClick={() => logWeightDelta('lost')}>
                            <TrendingDown size={18} /> Lost {deltaAmount} {unitLabel}
                        </motion.button>
                        <label style={styles.deltaInputWrap}>
                            <span style={styles.deltaInputLabel}>Change amount</span>
                            <input
                                type="number"
                                min="0.1"
                                step={units === 'imperial' ? '0.5' : '0.1'}
                                value={deltaAmount}
                                onChange={(event) => setDeltaAmount(Number(event.currentTarget.value))}
                                style={styles.deltaInput}
                            />
                        </label>
                        <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.gainButton} onClick={() => logWeightDelta('gained')}>
                            <Plus size={18} /> Gained {deltaAmount} {unitLabel}
                        </motion.button>
                    </div>
                </section>

                <section style={styles.metrics}>
                    {metrics.map(([label, value, Icon, color]) => (
                        <article key={String(label)} style={styles.metric}>
                            <Icon size={23} color={String(color)} />
                            <p style={styles.metricLabel}>{label}</p>
                            <p style={styles.metricValue}>{value}</p>
                        </article>
                    ))}
                </section>
                {lastError ? <p style={styles.errorText}>{lastError}</p> : null}
            </main>
        </div>
    );
}

const glass: CSSProperties = { background: 'var(--app-card)', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow)' };
const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100%', color: 'var(--app-text)', background: 'var(--app-bg)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', userSelect: 'none' },
    bg: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 15% 0%, rgba(26,115,232,.10), transparent 32%), radial-gradient(circle at 92% 18%, rgba(0,191,165,.11), transparent 30%)' },
    main: { position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', padding: '28px 18px', boxSizing: 'border-box' },
    kicker: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    title: { margin: '8px 0 0', fontSize: 34, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.8 },
    copy: { margin: '12px 0 18px', maxWidth: 580, color: 'var(--app-muted)', fontSize: 16, lineHeight: 1.45 },
    card: { ...glass, borderRadius: 30, padding: 18 },
    row: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
    label: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    big: { margin: '8px 0 0', color: 'var(--app-text)', fontSize: 34, lineHeight: 1, fontWeight: 850, letterSpacing: -0.8 },
    goalText: { margin: '8px 0 0', color: 'var(--app-muted)', fontSize: 13, fontWeight: 750 },
    delta: { borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: '9px 13px', fontWeight: 800 },
    chart: { height: 300, marginTop: 18 },
    actions: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 14 },
    lossButton: { minHeight: 52, border: 0, borderRadius: 999, background: 'var(--app-secondary-soft)', color: 'var(--app-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: 'inherit', fontWeight: 900 },
    gainButton: { minHeight: 52, border: 0, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: 'inherit', fontWeight: 900 },
    deltaInputWrap: { minHeight: 52, borderRadius: 999, background: 'var(--app-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', boxSizing: 'border-box' },
    deltaInputLabel: { color: 'var(--app-muted)', fontSize: 11, fontWeight: 800 },
    deltaInput: { width: '100%', border: 0, outline: 'none', background: 'transparent', color: 'var(--app-text)', textAlign: 'center', font: 'inherit', fontWeight: 900 },
    metrics: { display: 'grid', gridTemplateColumns: 'repeat(1,minmax(0,1fr))', gap: 12, marginTop: 14 },
    metric: { ...glass, borderRadius: 28, padding: 16 },
    metricLabel: { margin: '18px 0 0', color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    metricValue: { margin: '7px 0 0', color: 'var(--app-text)', fontSize: 23, fontWeight: 850, letterSpacing: -0.4 },
    errorText: { color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.35, margin: '14px 4px 0' },
};
