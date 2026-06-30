import type { CSSProperties } from 'react';
import {
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { ArrowUpRight, Dumbbell, ShieldCheck } from 'lucide-react';

type VolumePoint = {
    muscle: string;
    sets: number;
    target: number;
};

const weeklyVolume: VolumePoint[] = [
    { muscle: 'Chest', sets: 18, target: 12 },
    { muscle: 'Back', sets: 10, target: 18 },
    { muscle: 'Quads', sets: 12, target: 14 },
    { muscle: 'Hamstrings', sets: 8, target: 16 },
    { muscle: 'Shoulders', sets: 14, target: 10 },
    { muscle: 'Arms', sets: 11, target: 10 },
];

const posteriorDeficit =
    weeklyVolume.find((point) => point.muscle === 'Back')!.target +
    weeklyVolume.find((point) => point.muscle === 'Hamstrings')!.target -
    weeklyVolume.find((point) => point.muscle === 'Back')!.sets -
    weeklyVolume.find((point) => point.muscle === 'Hamstrings')!.sets;

const pushingVolume =
    weeklyVolume.find((point) => point.muscle === 'Chest')!.sets +
    weeklyVolume.find((point) => point.muscle === 'Shoulders')!.sets;

const pullingVolume =
    weeklyVolume.find((point) => point.muscle === 'Back')!.sets +
    weeklyVolume.find((point) => point.muscle === 'Hamstrings')!.sets;

function insightText() {
    if (pushingVolume > pullingVolume) {
        return `You are heavily biased toward anterior pushing movements this week. Cunningham protocol suggests adding ${Math.max(8, posteriorDeficit)} sets of posterior chain pulling tomorrow.`;
    }
    return 'Posterior chain balance is on track. Keep tomorrow’s hinge work crisp and avoid adding junk volume.';
}

export default function Analytics() {
    return (
        <div style={styles.screen}>
            <div style={styles.background} />
            <main style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <div style={styles.brand}>Cunningham Fitness</div>
                        <h1 style={styles.title}>Analytics</h1>
                        <p style={styles.subtitle}>Deep volume audit for serious strength progression.</p>
                    </div>
                    <button type="button" style={styles.primaryButton} onClick={() => window.location.assign('/active-workout')}>
                        <Dumbbell size={18} />
                        Resume Lift
                    </button>
                </header>

                <section style={styles.heroGrid}>
                    <div style={styles.chartCard}>
                        <div style={styles.cardHeader}>
                            <div>
                                <p style={styles.label}>Weekly sets per muscle group</p>
                                <h2 style={styles.cardTitle}>Volume Radar</h2>
                            </div>
                            <ShieldCheck color="var(--app-secondary)" size={24} />
                        </div>

                        <div style={styles.chartWrap}>
                            <ResponsiveContainer width="100%" height={330}>
                                <RadarChart data={weeklyVolume} outerRadius="74%">
                                    <PolarGrid stroke="var(--app-border)" />
                                    <PolarAngleAxis
                                        dataKey="muscle"
                                        tick={{ fill: 'var(--app-muted)', fontSize: 12, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--app-card)',
                                            border: '1px solid var(--app-border)',
                                            borderRadius: 18,
                                            color: 'var(--app-text)',
                                            boxShadow: '0 10px 28px rgba(15,23,42,0.08)',
                                        }}
                                        labelStyle={{ color: 'var(--app-accent)', fontWeight: 800 }}
                                    />
                                    <Radar
                                        name="Current Sets"
                                        dataKey="sets"
                                        stroke="var(--app-accent)"
                                        strokeWidth={3}
                                        fill="var(--app-accent)"
                                        fillOpacity={0.18}
                                        dot={{ fill: 'var(--app-accent)', r: 4 }}
                                    />
                                    <Radar
                                        name="Protocol Target"
                                        dataKey="target"
                                        stroke="var(--app-secondary)"
                                        strokeWidth={2}
                                        fill="var(--app-secondary)"
                                        fillOpacity={0.08}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <aside style={styles.insightCard}>
                        <p style={styles.label}>Coach insight</p>
                        <h2 style={styles.insightTitle}>Posterior chain correction window</h2>
                        <p style={styles.insightText}>{insightText()}</p>
                        <div style={styles.protocolStack}>
                            {[
                                ['Tomorrow priority', 'Chest-supported row + RDL'],
                                ['Minimum effective dose', `${Math.max(8, posteriorDeficit)} posterior-chain sets`],
                                ['Recovery cap', 'Keep pressing under RPE 7'],
                            ].map(([label, value]) => (
                                <div key={label} style={styles.protocolRow}>
                                    <span style={styles.protocolLabel}>{label}</span>
                                    <strong style={styles.protocolValue}>{value}</strong>
                                </div>
                            ))}
                        </div>
                    </aside>
                </section>

                <section style={styles.metricGrid}>
                    {weeklyVolume.map((point) => {
                        const delta = point.sets - point.target;
                        const over = delta >= 0;
                        return (
                            <article key={point.muscle} style={styles.metricCard}>
                                <div style={styles.metricTop}>
                                    <span style={styles.metricName}>{point.muscle}</span>
                                    <ArrowUpRight size={15} color={over ? 'var(--app-secondary)' : 'var(--app-accent)'} />
                                </div>
                                <div style={styles.metricValue}>{point.sets}</div>
                                <p style={styles.metricCopy}>
                                    {over
                                        ? `${delta} sets above protocol target. Keep quality high, not just volume.`
                                        : `${Math.abs(delta)} sets below protocol target. Add focused work before the week closes.`}
                                </p>
                            </article>
                        );
                    })}
                </section>
            </main>
        </div>
    );
}

const glass: CSSProperties = {
    background: 'var(--app-card)',
    border: '1px solid var(--app-border)',
    boxShadow: 'var(--app-shadow)',
};

const styles: Record<string, CSSProperties> = {
    screen: {
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--app-bg)',
        color: 'var(--app-text)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
    },
    background: {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: 'var(--app-bg)',
    },
    main: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 1040,
        margin: '0 auto',
        padding: 'calc(env(safe-area-inset-top) + 34px) 18px calc(env(safe-area-inset-bottom) + 128px)',
        boxSizing: 'border-box',
    },
    header: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 18,
        marginBottom: 20,
    },
    brand: {
        color: 'var(--app-muted)',
        fontSize: 13,
        fontWeight: 760,
        letterSpacing: 0,
    },
    title: {
        margin: '8px 0 0',
        fontSize: 44,
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: -1.8,
    },
    subtitle: {
        margin: '10px 0 0',
        color: 'var(--app-muted)',
        fontSize: 15,
        lineHeight: 1.5,
    },
    primaryButton: {
        border: 0,
        borderRadius: 999,
        minHeight: 46,
        padding: '0 18px',
        background: 'var(--app-accent)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 14,
        fontWeight: 900,
        boxShadow: 'none',
        whiteSpace: 'nowrap',
    },
    heroGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
    },
    chartCard: {
        ...glass,
        borderRadius: 40,
        padding: 22,
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
    },
    label: {
        margin: 0,
        color: 'var(--app-muted)',
        fontSize: 13,
        fontWeight: 720,
        letterSpacing: 0,
    },
    cardTitle: {
        margin: '6px 0 0',
        fontSize: 28,
        fontWeight: 880,
        letterSpacing: -0.8,
    },
    chartWrap: {
        height: 340,
        filter: 'none',
    },
    insightCard: {
        ...glass,
        borderRadius: 40,
        padding: 22,
    },
    insightTitle: {
        margin: '10px 0 0',
        fontSize: 28,
        lineHeight: 1.05,
        fontWeight: 900,
        letterSpacing: -0.9,
    },
    insightText: {
        margin: '18px 0 0',
        color: 'var(--app-muted)',
        fontSize: 16,
        lineHeight: 1.55,
        fontWeight: 620,
    },
    protocolStack: {
        display: 'grid',
        gap: 10,
        marginTop: 22,
    },
    protocolRow: {
        borderRadius: 24,
        background: 'var(--app-bg)',
        padding: 14,
    },
    protocolLabel: {
        display: 'block',
        color: 'var(--app-muted)',
        fontSize: 12,
        fontWeight: 680,
    },
    protocolValue: {
        display: 'block',
        marginTop: 5,
        color: 'var(--app-text)',
        fontSize: 14,
        lineHeight: 1.35,
    },
    metricGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginTop: 16,
    },
    metricCard: {
        ...glass,
        borderRadius: 32,
        padding: 18,
    },
    metricTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    metricName: {
        color: 'var(--app-muted)',
        fontSize: 14,
        fontWeight: 760,
    },
    metricValue: {
        marginTop: 18,
        color: 'var(--app-heading)',
        fontSize: 42,
        lineHeight: 1,
        fontWeight: 250,
        letterSpacing: -1.6,
    },
    metricCopy: {
        margin: '10px 0 0',
        color: 'var(--app-muted)',
        fontSize: 13,
        lineHeight: 1.45,
    },
};
