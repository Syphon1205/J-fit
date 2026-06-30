import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Dumbbell, Repeat2, RotateCcw, Timer } from 'lucide-react';
import { ExerciseProfile, getAlternateExercise, getExerciseById } from '../utils/exerciseLogic';

const spring = { type: 'spring', stiffness: 420, damping: 30 } as const;

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.max(0, seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

function ExerciseCard({ exercise }: { exercise: ExerciseProfile }) {
    return (
        <motion.article
            key={exercise.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={spring}
            style={styles.card}
        >
            <div style={styles.cardHeader}>
                <div>
                    <p style={styles.label}>Current exercise</p>
                    <h2 style={styles.exerciseTitle}>{exercise.name}</h2>
                </div>
                <span style={styles.exerciseIcon}><Dumbbell size={22} /></span>
            </div>
            <p style={styles.copy}>{exercise.coachingCue}</p>
            <div style={styles.chips}>
                <span style={styles.chip}>{exercise.prescription}</span>
                <span style={styles.chipBlue}>{exercise.equipment}</span>
                <span style={styles.chipTeal}>{exercise.muscleGroup}</span>
            </div>
        </motion.article>
    );
}

export default function ActiveWorkout() {
    const router = useRouter();
    const [exercise, setExercise] = useState(() => getExerciseById('barbell-bench-press'));
    const [restSeconds, setRestSeconds] = useState(98);
    const alternate = useMemo(() => getAlternateExercise(exercise.id), [exercise.id]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setRestSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        return () => window.clearInterval(interval);
    }, []);

    const restartRest = () => setRestSeconds(105);
    const swapExercise = () => {
        setExercise(alternate);
        setRestSeconds(105);
    };
    const finishSet = () => router.push('/progress' as never);

    return (
        <div style={styles.screen}>
            <main style={styles.main}>
                <header style={styles.topBar}>
                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.backButton} onClick={() => router.push('/workouts' as never)}>
                        <ArrowLeft size={22} />
                    </motion.button>
                    <div style={styles.headerCopy}>
                        <p style={styles.kicker}>Active workout</p>
                        <h1 style={styles.title}>Strength Block</h1>
                    </div>
                </header>

                <section style={styles.timerCard}>
                    <div style={styles.timerIcon}><Timer size={22} /></div>
                    <div>
                        <p style={styles.label}>Rest timer</p>
                        <p style={styles.timer}>{formatTime(restSeconds)}</p>
                        <p style={styles.copy}>Recover, reset your setup, and keep the next set clean.</p>
                    </div>
                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.secondaryButton} onClick={restartRest}>
                        <RotateCcw size={16} /> Restart
                    </motion.button>
                </section>

                <AnimatePresence mode="popLayout">
                    <ExerciseCard exercise={exercise} />
                </AnimatePresence>

                <section style={styles.swapCard}>
                    <div>
                        <p style={styles.swapTitle}>Equipment occupied?</p>
                        <p style={styles.copy}>Swap to {alternate.name} and keep the same training stimulus with different equipment.</p>
                    </div>
                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.swapButton} onClick={swapExercise}>
                        <Repeat2 size={17} /> Swap
                    </motion.button>
                </section>

                <section style={styles.grid}>
                    {[
                        ['Set plan', '4 working sets', 'Controlled reps with one clean reserve.'],
                        ['Target', 'Chest + triceps', 'Pressing volume without shoulder irritation.'],
                        ['Intensity', 'Moderate-heavy', 'Stay crisp before load gets aggressive.'],
                    ].map(([label, value, detail]) => (
                        <article key={label} style={styles.metricCard}>
                            <p style={styles.label}>{label}</p>
                            <strong style={styles.metricValue}>{value}</strong>
                            <span style={styles.metricDetail}>{detail}</span>
                        </article>
                    ))}
                </section>

                <motion.button type="button" whileTap={{ scale: 0.96 }} transition={spring} style={styles.primaryButton} onClick={finishSet}>
                    <CheckCircle2 size={20} /> Complete Set
                </motion.button>
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
    screen: { height: '100dvh', minHeight: '100dvh', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', background: 'var(--app-bg)', color: 'var(--app-text)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', WebkitOverflowScrolling: 'touch', userSelect: 'none' },
    main: { width: '100%', maxWidth: 820, margin: '0 auto', padding: 'max(92px, calc(env(safe-area-inset-top) + 42px)) 16px calc(env(safe-area-inset-bottom) + 128px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 },
    topBar: { display: 'flex', alignItems: 'center', gap: 14 },
    backButton: { width: 52, height: 52, borderRadius: 999, border: 0, background: 'var(--app-card)', color: 'var(--app-text)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(15,23,42,.08)' },
    headerCopy: { minWidth: 0 },
    kicker: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 750 },
    title: { margin: '4px 0 0', color: 'var(--app-heading)', fontSize: 34, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.8 },
    timerCard: { ...card, padding: 18, display: 'grid', gridTemplateColumns: '52px 1fr auto', alignItems: 'center', gap: 14 },
    timerIcon: { width: 52, height: 52, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center' },
    label: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 750 },
    timer: { margin: '4px 0', color: 'var(--app-heading)', fontVariantNumeric: 'tabular-nums', fontSize: 34, lineHeight: 1, fontWeight: 850, letterSpacing: -0.8 },
    copy: { margin: '8px 0 0', color: 'var(--app-muted)', fontSize: 15, lineHeight: 1.45 },
    secondaryButton: { border: 0, borderRadius: 999, background: 'var(--app-raised)', color: '#334155', minHeight: 42, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 7, font: 'inherit', fontWeight: 800 },
    card: { ...card, padding: 20 },
    cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
    exerciseTitle: { margin: '8px 0 0', color: 'var(--app-heading)', fontSize: 31, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.8 },
    exerciseIcon: { width: 52, height: 52, borderRadius: 999, background: '#ecfdf5', color: 'var(--app-secondary)', display: 'grid', placeItems: 'center', flexShrink: 0 },
    chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    chip: { borderRadius: 999, background: 'var(--app-raised)', color: '#334155', padding: '8px 12px', fontSize: 13, fontWeight: 750 },
    chipBlue: { borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: '8px 12px', fontSize: 13, fontWeight: 750 },
    chipTeal: { borderRadius: 999, background: '#ecfdf5', color: '#047857', padding: '8px 12px', fontSize: 13, fontWeight: 750 },
    swapCard: { ...card, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
    swapTitle: { margin: 0, color: 'var(--app-heading)', fontSize: 18, fontWeight: 850, letterSpacing: -0.2 },
    swapButton: { border: 0, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', minHeight: 44, padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: 7, font: 'inherit', fontWeight: 850, flexShrink: 0 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 },
    metricCard: { ...card, padding: 16 },
    metricValue: { display: 'block', marginTop: 8, color: 'var(--app-heading)', fontSize: 20, lineHeight: 1.1, fontWeight: 850, letterSpacing: -0.4 },
    metricDetail: { display: 'block', marginTop: 8, color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.35 },
    primaryButton: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 56, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, font: 'inherit', fontSize: 16, fontWeight: 850, boxShadow: '0 12px 28px rgba(26,115,232,.18)' },
};
