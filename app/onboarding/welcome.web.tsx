import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, Dumbbell, Flame, HeartPulse, ShieldCheck } from 'lucide-react';
import { useAuthStore, type User } from '../../src/stores/authStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { GOOGLE_PRIVACY_POLICY_URL } from '../settings/privacy-policy';

const goals: Array<[string, User['fitnessGoal']]> = [
    ['Build muscle', 'build_muscle'],
    ['Lose weight', 'lose_weight'],
    ['Improve endurance', 'improve_endurance'],
    ['Stay fit', 'stay_fit'],
];

const focusOptions = ['Watch health sync', 'Trainer review', 'Run tracking', 'Sleep and recovery', 'Strength plan', 'Daily agenda'];

export default function OnboardingWeb() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
    const addWeight = useProgressStore((state) => state.addWeight);
    const [name, setName] = useState(user?.name && user.name !== 'Guest' ? user.name : '');
    const [goal, setGoal] = useState<User['fitnessGoal']>(user?.fitnessGoal ?? 'build_muscle');
    const [focus, setFocus] = useState<string[]>(['Watch health sync']);
    const [weight, setWeight] = useState(user?.weight ? String(Math.round(user.weight * 2.20462)) : '');
    const [goalWeight, setGoalWeight] = useState(user?.goalWeight ? String(Math.round(user.goalWeight * 2.20462)) : '');
    const [accepted, setAccepted] = useState(false);
    const ready = useMemo(() => name.trim().length >= 2 && focus.length > 0 && accepted, [accepted, focus.length, name]);

    const toggleFocus = (item: string) => setFocus((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);

    const finish = () => {
        if (!ready) return;
        const weightLb = Number(weight);
        const goalWeightLb = Number(goalWeight);
        const weightKg = Number.isFinite(weightLb) && weightLb > 0 ? Math.round((weightLb / 2.20462) * 10) / 10 : undefined;
        const goalWeightKg = Number.isFinite(goalWeightLb) && goalWeightLb > 0 ? Math.round((goalWeightLb / 2.20462) * 10) / 10 : undefined;
        completeOnboarding({ name: name.trim(), goals: focus, weight: weightKg, goalWeight: goalWeightKg, fitnessGoal: goal });
        if (weightKg) addWeight({ date: new Date().toISOString().split('T')[0], value: weightKg });
        router.replace('/' as never);
    };

    return (
        <div style={styles.screen}>
            <main style={styles.main}>
                <section style={styles.hero}>
                    <span style={styles.logo}><Dumbbell size={30} /></span>
                    <p style={styles.kicker}>Cunningham Fitness</p>
                    <h1 style={styles.title}>Build your private training hub.</h1>
                    <p style={styles.copy}>Set your goals, choose what you want tracked, and review privacy before health sync, trainer sync, runs, and agenda features turn on.</p>
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}><HeartPulse size={18} /> Profile</p>
                    <label style={styles.label}>Name<input style={styles.input} value={name} onChange={(event) => setName(event.currentTarget.value)} placeholder="Your name" /></label>
                    <div style={styles.goalGrid}>
                        {goals.map(([label, value]) => (
                            <motion.button key={value} type="button" whileTap={{ scale: 0.97 }} style={goal === value ? styles.goalOn : styles.goalOff} onClick={() => setGoal(value)}>
                                {label}
                            </motion.button>
                        ))}
                    </div>
                    <div style={styles.twoCol}>
                        <label style={styles.label}>Weight lb<input style={styles.input} value={weight} onChange={(event) => setWeight(event.currentTarget.value.replace(/[^\d.]/g, ''))} placeholder="168" /></label>
                        <label style={styles.label}>Goal lb<input style={styles.input} value={goalWeight} onChange={(event) => setGoalWeight(event.currentTarget.value.replace(/[^\d.]/g, ''))} placeholder="Optional" /></label>
                    </div>
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}><BarChart3 size={18} /> Coaching focus</p>
                    <div style={styles.focusGrid}>
                        {focusOptions.map((item) => {
                            const active = focus.includes(item);
                            return (
                                <button key={item} type="button" style={active ? styles.focusOn : styles.focusOff} onClick={() => toggleFocus(item)}>
                                    {active ? <CheckCircle2 size={15} /> : null}{item}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}><ShieldCheck size={18} /> Privacy Policy</p>
                    <p style={styles.copy}>Open the policy in a browser, then confirm your agreement to continue.</p>
                    <button type="button" style={styles.policyButton} onClick={() => window.open(GOOGLE_PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')}>
                        Open Privacy Policy
                    </button>
                    <label style={styles.acceptRow}>
                        <input style={styles.checkbox} type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.currentTarget.checked)} />
                        I have reviewed and agree to the Privacy Policy.
                    </label>
                </section>

                <button type="button" style={ready ? styles.finish : styles.finishDisabled} disabled={!ready} onClick={finish}>
                    <Flame size={18} /> Finish setup
                </button>
            </main>
        </div>
    );
}

const card: CSSProperties = { background: 'var(--app-card)', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow)', borderRadius: 30 };
const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100dvh', overflowY: 'auto', background: 'var(--app-bg)', color: 'var(--app-text)', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))', boxSizing: 'border-box' },
    main: { width: '100%', maxWidth: 780, margin: '0 auto', display: 'grid', gap: 14, padding: '24px 0 calc(env(safe-area-inset-bottom, 24px) + 24px)' },
    hero: { ...card, padding: 24, background: 'linear-gradient(135deg, var(--app-card), var(--app-accent-soft))' },
    logo: { width: 58, height: 58, borderRadius: 999, background: 'var(--app-gradient-primary)', color: '#fff', display: 'grid', placeItems: 'center' },
    kicker: { margin: '14px 0 0', color: 'var(--app-accent)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 },
    title: { margin: '8px 0 0', color: 'var(--app-heading)', fontSize: 38, lineHeight: 1.02, fontWeight: 950, letterSpacing: -0.8 },
    copy: { margin: '8px 0 0', color: 'var(--app-muted)', fontSize: 14, lineHeight: 1.45, fontWeight: 650 },
    card: { ...card, padding: 16, display: 'grid', gap: 12 },
    sectionTitle: { margin: 0, color: 'var(--app-heading)', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 900 },
    label: { display: 'grid', gap: 7, color: 'var(--app-muted)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { width: '100%', boxSizing: 'border-box', minHeight: 48, borderRadius: 18, border: '1px solid var(--app-border)', background: 'var(--app-bg)', color: 'var(--app-heading)', padding: '0 14px', font: 'inherit', fontSize: 15, fontWeight: 800, outline: 'none' },
    checkbox: { width: 22, height: 22, flexShrink: 0, accentColor: 'var(--app-accent)', margin: 0 },
    goalGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 },
    goalOn: { minHeight: 52, border: 0, borderRadius: 18, background: 'var(--app-gradient-primary)', color: '#fff', font: 'inherit', fontWeight: 900 },
    goalOff: { minHeight: 52, border: '1px solid var(--app-border)', borderRadius: 18, background: 'var(--app-bg)', color: 'var(--app-text)', font: 'inherit', fontWeight: 850 },
    twoCol: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 },
    focusGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    focusOn: { border: '1px solid var(--app-accent)', borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', padding: '10px 12px', font: 'inherit', fontWeight: 850, display: 'inline-flex', alignItems: 'center', gap: 6 },
    focusOff: { border: '1px solid var(--app-border)', borderRadius: 999, background: 'var(--app-bg)', color: 'var(--app-muted)', padding: '10px 12px', font: 'inherit', fontWeight: 800 },
    policyBox: { maxHeight: 280, overflowY: 'auto', borderRadius: 22, background: 'var(--app-bg)', border: '1px solid var(--app-border)', padding: 14, display: 'grid', gap: 12 },
    policyBlock: { display: 'grid', gap: 4, color: 'var(--app-muted)', fontSize: 13, lineHeight: 1.45 },
    policyButton: { minHeight: 50, border: 0, borderRadius: 999, background: 'var(--app-gradient-primary)', color: '#fff', font: 'inherit', fontWeight: 950 },
    acceptRow: { borderRadius: 18, background: 'var(--app-accent-soft)', color: 'var(--app-heading)', padding: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 850 },
    acceptRowDisabled: { borderRadius: 18, background: 'var(--app-bg)', color: 'var(--app-muted)', padding: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 850 },
    finish: { minHeight: 56, border: 0, borderRadius: 999, background: 'var(--app-gradient-primary)', color: '#fff', font: 'inherit', fontWeight: 950, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    finishDisabled: { minHeight: 56, border: 0, borderRadius: 999, background: 'var(--app-muted-surface)', color: 'var(--app-muted)', font: 'inherit', fontWeight: 950, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
};
