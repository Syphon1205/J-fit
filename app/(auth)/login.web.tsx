import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../../src/stores/authStore';

export default function AuthWeb() {
    const router = useRouter();
    const { continueAsGuest, updateProfile } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const login = async () => {
        setLoading(true);
        await continueAsGuest();
        updateProfile({ name: email.split('@')[0] || 'Cunningham Athlete' });
        window.setTimeout(() => router.replace('/onboarding/welcome' as never), 350);
    };

    return (
        <div style={styles.screen}>
            <main style={styles.card}>
                <span style={styles.logo}><Dumbbell size={30} /></span>
                <h1 style={styles.title}>Cunningham Fitness</h1>
                <p style={styles.copy}>Sign in to build your local protocol on this device.</p>
                <label style={styles.inputWrap}><Mail size={18} /><input style={styles.input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" /></label>
                <label style={styles.inputWrap}><Lock size={18} /><input style={styles.input} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" /></label>
                <motion.button type="button" layout whileTap={{ scale: 0.95 }} style={styles.primary} onClick={login}>
                    <AnimatePresence mode="popLayout">
                        <motion.span key={loading ? 'loading' : 'ready'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            {loading ? 'Checking account...' : 'Continue'}
                        </motion.span>
                    </AnimatePresence>
                    <ArrowRight size={18} />
                </motion.button>
            </main>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    screen: { minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#020617', color: '#fff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', padding: 20 },
    card: { width: '100%', maxWidth: 420, borderRadius: 34, background: 'rgba(15,23,42,.92)', border: '1px solid rgba(255,255,255,.08)', padding: 24, boxShadow: '0 30px 90px rgba(0,0,0,.35)' },
    logo: { width: 72, height: 72, borderRadius: 999, background: '#CCFF00', color: '#020617', display: 'grid', placeItems: 'center' },
    title: { margin: '20px 0 0', fontSize: 34, lineHeight: 1.05, fontWeight: 850, letterSpacing: -0.9 },
    copy: { margin: '10px 0 22px', color: '#cbd5e1', fontSize: 15, lineHeight: 1.45 },
    inputWrap: { minHeight: 56, borderRadius: 20, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', marginTop: 10, color: '#94a3b8' },
    input: { flex: 1, border: 0, outline: 'none', background: 'transparent', color: '#fff', font: 'inherit', fontSize: 16 },
    primary: { marginTop: 18, width: '100%', minHeight: 56, border: 0, borderRadius: 999, background: '#CCFF00', color: '#020617', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, font: 'inherit', fontWeight: 850 },
};
