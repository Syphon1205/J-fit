import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, Dumbbell, Flame, Leaf, Play, Plus, Trash2, Timer, Video, Zap, type LucideIcon } from 'lucide-react';
import WorkoutPlayer from '../components/WorkoutPlayer';
import { useRepLogStore } from '../stores/repLogStore';
import { useRunStore } from '../stores/runStore';
import { useWorkoutStore } from '../stores/workoutStore';

const todayKey = () => new Date().toISOString().slice(0, 10);
const shiftDate = (date: string, days: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + days);
    return next.toISOString().slice(0, 10);
};
const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));

export default function Workouts() {
    const router = useRouter();
    const { workouts } = useWorkoutStore();
    const { sessions } = useRunStore();
    const { repEntries, addRepEntry, removeRepEntry } = useRepLogStore();
    const [selectedDate, setSelectedDate] = useState(todayKey());
    const [exercise, setExercise] = useState('Bench Press');
    const [sets, setSets] = useState('3');
    const [reps, setReps] = useState('10');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const dayEntries = useMemo(
        () => repEntries.filter((entry) => entry.date === selectedDate).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        [repEntries, selectedDate],
    );
    const dailyTotals = useMemo(() => {
        const totalSets = dayEntries.reduce((sum, entry) => sum + entry.sets, 0);
        const totalReps = dayEntries.reduce((sum, entry) => sum + entry.sets * entry.reps, 0);
        const volume = dayEntries.reduce((sum, entry) => sum + (entry.weightKg ?? 0) * entry.sets * entry.reps, 0);
        return { totalSets, totalReps, volume: Math.round(volume) };
    }, [dayEntries]);
    const metrics: Array<[string, string, LucideIcon, string]> = [
        ['Program Density', `${workouts.length} blocks`, Dumbbell, 'var(--app-accent)'],
        ['Run Base', `${sessions.length} sessions`, Activity, 'var(--app-secondary)'],
        ['Reps Logged', `${dailyTotals.totalReps} today`, Timer, 'var(--app-accent)'],
    ];
    const workoutIcons: Record<string, LucideIcon> = {
        strength: Dumbbell,
        cardio: Activity,
        hiit: Zap,
        yoga: Leaf,
        flexibility: Leaf,
    };
    const submitRepEntry = () => {
        const parsedSets = Number(sets);
        const parsedReps = Number(reps);
        const parsedWeight = weight.trim() ? Number(weight) : undefined;
        if (!exercise.trim() || !Number.isFinite(parsedSets) || !Number.isFinite(parsedReps) || parsedSets <= 0 || parsedReps <= 0) return;
        addRepEntry({
            date: selectedDate,
            exercise,
            sets: parsedSets,
            reps: parsedReps,
            weightKg: parsedWeight && Number.isFinite(parsedWeight) ? parsedWeight : undefined,
            notes,
        });
        setNotes('');
    };

    return (
        <div style={styles.screen}>
            <div style={styles.bg} />
            <main style={styles.main}>
                <header style={styles.header}>
                    <div>
                        <p style={styles.kicker}>Training</p>
                        <h1 style={styles.title}>Workouts</h1>
                        <p style={styles.copy}>Clean training blocks for strength, conditioning, and movement quality.</p>
                    </div>
                    <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.primary} onClick={() => router.push('/active-workout' as never)}>
                        <Play size={18} /> Start
                    </motion.button>
                </header>

                <section style={styles.heroGrid}>
                    <article style={styles.hero}>
                        <div style={styles.media}>
                            <span style={styles.badge}><Video size={16} /> Technique Library</span>
                        </div>
                        <div style={styles.cardBody}>
                            <h2 style={styles.cardTitle}>Movement videos</h2>
                            <p style={styles.cardCopy}>Short form cues and exercise guidance without leaving the training flow.</p>
                        </div>
                    </article>
                    <WorkoutPlayer exerciseId="pushup" />
                </section>

                <section style={styles.metricGrid}>
                    {metrics.map(([label, value, Icon, color]) => (
                        <article key={label} style={styles.metric}>
                            <Icon size={23} color={color} />
                            <p style={styles.metricLabel}>{label}</p>
                            <p style={styles.metricValue}>{value}</p>
                        </article>
                    ))}
                </section>

                <section style={styles.repPanel}>
                    <div style={styles.repTop}>
                        <div>
                            <p style={styles.kicker}>Rep logger</p>
                            <h2 style={styles.cardTitle}>Track sets by day</h2>
                            <p style={styles.cardCopy}>Log working sets, browse past dates, and keep strength progress visible.</p>
                        </div>
                        <div style={styles.dateStepper}>
                            <motion.button type="button" whileTap={{ scale: 0.94 }} style={styles.iconButton} onClick={() => setSelectedDate((date) => shiftDate(date, -1))} aria-label="Previous day">
                                <ChevronLeft size={18} />
                            </motion.button>
                            <span style={styles.datePill}><CalendarDays size={16} /> {formatDate(selectedDate)}</span>
                            <motion.button type="button" whileTap={{ scale: 0.94 }} style={styles.iconButton} onClick={() => setSelectedDate((date) => shiftDate(date, 1))} aria-label="Next day">
                                <ChevronRight size={18} />
                            </motion.button>
                        </div>
                    </div>
                    <div style={styles.repGrid}>
                        <div style={styles.loggerCard}>
                            <label style={styles.fieldLabel}>
                                Exercise
                                <input style={styles.input} value={exercise} onChange={(event) => setExercise(event.currentTarget.value)} placeholder="Exercise name" />
                            </label>
                            <div style={styles.formRow}>
                                <label style={styles.fieldLabel}>
                                    Sets
                                    <input style={styles.input} inputMode="numeric" value={sets} onChange={(event) => setSets(event.currentTarget.value)} />
                                </label>
                                <label style={styles.fieldLabel}>
                                    Reps
                                    <input style={styles.input} inputMode="numeric" value={reps} onChange={(event) => setReps(event.currentTarget.value)} />
                                </label>
                                <label style={styles.fieldLabel}>
                                    Weight kg
                                    <input style={styles.input} inputMode="decimal" value={weight} onChange={(event) => setWeight(event.currentTarget.value)} placeholder="Optional" />
                                </label>
                            </div>
                            <label style={styles.fieldLabel}>
                                Notes
                                <input style={styles.input} value={notes} onChange={(event) => setNotes(event.currentTarget.value)} placeholder="Tempo, form, soreness..." onKeyDown={(event) => { if (event.key === 'Enter') submitRepEntry(); }} />
                            </label>
                            <motion.button type="button" whileTap={{ scale: 0.97 }} style={styles.logButton} onClick={submitRepEntry}>
                                <Plus size={18} /> Log reps
                            </motion.button>
                        </div>
                        <div style={styles.historyCard}>
                            <div style={styles.totalGrid}>
                                <span style={styles.totalTile}><strong>{dailyTotals.totalSets}</strong><small>Sets</small></span>
                                <span style={styles.totalTile}><strong>{dailyTotals.totalReps}</strong><small>Reps</small></span>
                                <span style={styles.totalTile}><strong>{dailyTotals.volume}</strong><small>Volume kg</small></span>
                            </div>
                            <div style={styles.historyList}>
                                {dayEntries.length > 0 ? dayEntries.map((entry) => (
                                    <article key={entry.id} style={styles.repEntry}>
                                        <div>
                                            <strong style={styles.repName}>{entry.exercise}</strong>
                                            <p style={styles.repMeta}>
                                                {entry.sets} x {entry.reps}{entry.weightKg ? ` · ${entry.weightKg} kg` : ''}{entry.notes ? ` · ${entry.notes}` : ''}
                                            </p>
                                        </div>
                                        <button type="button" style={styles.deleteButton} onClick={() => removeRepEntry(entry.id)} aria-label={`Delete ${entry.exercise} entry`}>
                                            <Trash2 size={16} />
                                        </button>
                                    </article>
                                )) : (
                                    <div style={styles.emptyState}>
                                        <Dumbbell size={24} />
                                        <strong>No reps logged</strong>
                                        <span>Pick a movement and save the first set block for this day.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section style={styles.list}>
                    {workouts.slice(0, 6).map((workout) => (
                        <motion.button key={workout.id} type="button" whileTap={{ scale: 0.98 }} style={styles.workout} onClick={() => router.push(`/workout/${workout.id}` as never)}>
                            <div style={styles.thumb}>
                                <span style={styles.workoutIcon}>
                                    {(() => {
                                        const Icon = workoutIcons[workout.category] ?? Flame;
                                        return <Icon size={26} />;
                                    })()}
                                </span>
                                <span style={styles.badge}>{workout.difficulty === 'advanced' ? 'High intensity' : 'Foundation'}</span>
                            </div>
                            <div style={styles.cardBody}>
                                <h3 style={styles.workoutTitle}>{workout.name}</h3>
                                <p style={styles.cardCopy}>{workout.exercises.length} movements · {workout.duration} min · {workout.calories} kcal</p>
                            </div>
                        </motion.button>
                    ))}
                </section>
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
    screen: { minHeight: '100%', color: 'var(--app-text)', background: 'var(--app-bg)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitFontSmoothing: 'antialiased', userSelect: 'none' },
    bg: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 18% 0%, rgba(26,115,232,.10), transparent 32%), radial-gradient(circle at 90% 10%, rgba(0,191,165,.12), transparent 30%)' },
    main: { position: 'relative', zIndex: 1, width: '100%', maxWidth: 980, margin: '0 auto', padding: '28px 18px 28px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 },
    header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
    kicker: { margin: 0, color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    title: { margin: '8px 0 0', fontSize: 34, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.8 },
    copy: { margin: '12px 0 0', maxWidth: 560, color: 'var(--app-muted)', fontSize: 16, lineHeight: 1.45 },
    primary: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 46, padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 8, font: 'inherit', fontWeight: 800, boxShadow: '0 10px 24px rgba(26,115,232,.18)' },
    heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 },
    hero: { ...card, borderRadius: 32, overflow: 'hidden' },
    media: { minHeight: 118, background: 'linear-gradient(135deg, #dbeafe, #ccfbf1)', padding: 16 },
    badge: { width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: '8px 12px', fontSize: 12, fontWeight: 800, letterSpacing: 0 },
    cardBody: { padding: 18 },
    cardTitle: { margin: 0, color: 'var(--app-text)', fontSize: 22, lineHeight: 1.1, fontWeight: 850, letterSpacing: -0.4 },
    cardCopy: { margin: '8px 0 0', color: 'var(--app-muted)', fontSize: 14, lineHeight: 1.45, fontWeight: 500 },
    metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 },
    metric: { ...card, borderRadius: 28, padding: 16 },
    metricLabel: { margin: '18px 0 0', color: 'var(--app-muted)', fontSize: 13, fontWeight: 700 },
    metricValue: { margin: '7px 0 0', color: 'var(--app-text)', fontSize: 22, fontWeight: 850, letterSpacing: -0.4 },
    repPanel: { ...card, borderRadius: 30, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 },
    repTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' },
    dateStepper: { display: 'flex', alignItems: 'center', gap: 8 },
    iconButton: { width: 42, height: 42, borderRadius: 999, border: '1px solid var(--app-border)', background: 'var(--app-raised)', color: 'var(--app-text)', display: 'grid', placeItems: 'center' },
    datePill: { minHeight: 42, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 850 },
    repGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 },
    loggerCard: { borderRadius: 24, background: 'var(--app-raised)', padding: 14, display: 'flex', flexDirection: 'column', gap: 11 },
    historyCard: { borderRadius: 24, background: 'var(--app-raised)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 260 },
    fieldLabel: { display: 'flex', flexDirection: 'column', gap: 7, color: 'var(--app-muted)', fontSize: 12, fontWeight: 850 },
    input: { width: '100%', boxSizing: 'border-box', border: '1px solid var(--app-border)', borderRadius: 16, background: 'var(--app-card)', color: 'var(--app-text)', minHeight: 44, padding: '0 13px', font: 'inherit', fontWeight: 750, outline: 'none' },
    formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 10 },
    logButton: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 48, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, font: 'inherit', fontWeight: 850 },
    totalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 },
    totalTile: { borderRadius: 18, background: 'var(--app-card)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--app-muted)', fontSize: 12, fontWeight: 800 },
    historyList: { display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', maxHeight: 300, paddingRight: 2 },
    repEntry: { borderRadius: 18, background: 'var(--app-card)', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    repName: { color: 'var(--app-text)', fontSize: 15, fontWeight: 850 },
    repMeta: { margin: '5px 0 0', color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.35 },
    deleteButton: { width: 36, height: 36, borderRadius: 999, border: 0, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center', flexShrink: 0 },
    emptyState: { minHeight: 170, borderRadius: 20, border: '1px dashed var(--app-border)', color: 'var(--app-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center', padding: 18 },
    list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 14 },
    workout: { ...card, borderRadius: 32, color: 'var(--app-text)', overflow: 'hidden', textAlign: 'left', font: 'inherit', padding: 0 },
    thumb: { minHeight: 112, padding: 14, background: 'linear-gradient(135deg, var(--app-accent-soft), var(--app-raised))', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    workoutIcon: { width: 54, height: 54, borderRadius: 999, background: 'var(--app-card)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center', boxShadow: 'var(--app-shadow)' },
    workoutTitle: { margin: 0, color: 'var(--app-text)', fontSize: 21, lineHeight: 1.1, fontWeight: 850, letterSpacing: -0.4 },
};
