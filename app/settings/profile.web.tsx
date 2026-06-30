import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Ruler, Scale, Target, User } from 'lucide-react';
import { useAuthStore } from '../../src/stores/authStore';
import { useThemeStore } from '../../src/stores/themeStore';
import { useProgressStore } from '../../src/stores/progressStore';

export default function ProfileSettingsWeb() {
    const router = useRouter();
    const { user, updateProfile } = useAuthStore();
    const addWeight = useProgressStore((state) => state.addWeight);
    const units = useThemeStore((state) => state.units);
    const heightUnit = units === 'imperial' ? 'in' : 'cm';
    const weightUnit = units === 'imperial' ? 'lb' : 'kg';
    const [name, setName] = useState(user?.name ?? 'Athlete');
    const [height, setHeight] = useState(String(units === 'imperial' ? Math.round((user?.height ?? 178) / 2.54) : (user?.height ?? 178)));
    const [weight, setWeight] = useState(String(units === 'imperial' ? Math.round((user?.weight ?? 84) * 2.20462) : (user?.weight ?? 84)));
    const [goal, setGoal] = useState(user?.fitnessGoal ?? 'stay_fit');
    const [saved, setSaved] = useState(false);

    const save = () => {
        const parsedWeight = units === 'imperial'
            ? Math.round(((Number(weight) || (user?.weight ?? 76) * 2.20462) / 2.20462) * 10) / 10
            : Number(weight) || user?.weight;
        updateProfile({
            name: name.trim() || user?.name || 'Athlete',
            height: units === 'imperial' ? Math.round((Number(height) || 70) * 2.54) : Number(height) || user?.height,
            weight: parsedWeight,
            fitnessGoal: goal as never,
        });
        if (parsedWeight && parsedWeight !== user?.weight) {
            addWeight({ date: new Date().toISOString().split('T')[0], value: parsedWeight });
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1600);
    };

    return (
        <div style={styles.screen}>
            <main style={styles.main}>
                <Header title="Profile Settings" onBack={() => router.push('/profile' as never)} />
                <section style={styles.hero}>
                    <span style={styles.avatar}><User size={30} /></span>
                    <h1 style={styles.title}>{name || 'Athlete'}</h1>
                    <p style={styles.copy}>Update body metrics, goals, and coaching preferences used across Cunningham Fitness.</p>
                </section>

                <section style={styles.card}>
                    <Input label="Display name" value={name} onChange={setName} icon={<User size={18} />} />
                    <Input label="Height" value={height} onChange={setHeight} icon={<Ruler size={18} />} suffix={heightUnit} />
                    <Input label="Weight" value={weight} onChange={setWeight} icon={<Scale size={18} />} suffix={weightUnit} />
                </section>

                <section style={styles.card}>
                    <p style={styles.sectionTitle}><Target size={18} /> Coaching goal</p>
                    <div style={styles.goalGrid}>
                        {([
                            ['lose_weight', 'Lean out'],
                            ['build_muscle', 'Build muscle'],
                            ['stay_fit', 'Maintain fitness'],
                            ['improve_endurance', 'Improve endurance'],
                        ] as const).map(([id, label]) => (
                            <motion.button key={id} type="button" whileTap={{ scale: 0.95 }} style={goal === id ? styles.goalOn : styles.goalOff} onClick={() => setGoal(id)}>
                                {label}
                            </motion.button>
                        ))}
                    </div>
                </section>

                <motion.button type="button" whileTap={{ scale: 0.96 }} style={styles.primary} onClick={save}>
                    <CheckCircle2 size={20} /> {saved ? 'Saved' : 'Save Changes'}
                </motion.button>
            </main>
        </div>
    );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
    return (
        <header style={styles.topBar}>
            <motion.button type="button" whileTap={{ scale: 0.95 }} style={styles.backButton} onClick={onBack}>
                <ArrowLeft size={22} />
            </motion.button>
            <strong style={styles.topTitle}>{title}</strong>
            <span style={{ width: 52 }} />
        </header>
    );
}

function Input({ label, value, onChange, icon, suffix }: { label: string; value: string; onChange: (value: string) => void; icon: ReactNode; suffix?: string }) {
    return (
        <label style={styles.inputRow}>
            <span style={styles.inputIcon}>{icon}</span>
            <span style={styles.inputBody}>
                <span style={styles.inputLabel}>{label}</span>
                <input style={styles.input} value={value} onChange={(event) => onChange(event.target.value)} />
            </span>
            {suffix ? <span style={styles.suffix}>{suffix}</span> : null}
        </label>
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
    avatar: { width: 78, height: 78, borderRadius: 999, margin: '0 auto', background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center' },
    title: { margin: '16px 0 0', color: 'var(--app-heading)', fontSize: 30, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.7 },
    copy: { margin: '8px auto 0', maxWidth: 460, color: 'var(--app-muted)', fontSize: 15, lineHeight: 1.45 },
    card: { ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
    inputRow: { display: 'flex', alignItems: 'center', gap: 12, borderRadius: 24, background: 'var(--app-bg)', padding: 14 },
    inputIcon: { width: 42, height: 42, borderRadius: 999, background: 'var(--app-accent-soft)', color: 'var(--app-accent)', display: 'grid', placeItems: 'center', flexShrink: 0 },
    inputBody: { flex: 1, minWidth: 0 },
    inputLabel: { display: 'block', color: 'var(--app-muted)', fontSize: 12, fontWeight: 750 },
    input: { width: '100%', border: 0, outline: 'none', background: 'transparent', color: 'var(--app-heading)', font: 'inherit', fontSize: 18, fontWeight: 800, padding: '4px 0 0' },
    suffix: { color: 'var(--app-muted)', fontSize: 14, fontWeight: 750 },
    sectionTitle: { margin: '0 0 4px', color: 'var(--app-heading)', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 850 },
    goalGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 },
    goalOn: { border: 0, borderRadius: 999, background: 'var(--app-text)', color: 'var(--app-bg)', minHeight: 48, font: 'inherit', fontWeight: 800 },
    goalOff: { border: 0, borderRadius: 999, background: 'var(--app-raised)', color: 'var(--app-muted)', minHeight: 48, font: 'inherit', fontWeight: 750 },
    primary: { border: 0, borderRadius: 999, background: 'var(--app-accent)', color: '#fff', minHeight: 56, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, font: 'inherit', fontSize: 16, fontWeight: 850, boxShadow: '0 12px 28px rgba(26,115,232,.18)' },
};
