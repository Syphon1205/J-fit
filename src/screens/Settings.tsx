import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Bell,
    Check,
    Database,
    HeartPulse,
    MapPin,
    Moon,
    Palette,
    Ruler,
    Sparkles,
    Sun,
    Trash2,
    Zap,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider';
import { useThemeStore, type ThemeMode, type ThemePreset, type UnitSystem } from '../stores/themeStore';
import { clearAppCache, clearLocalDeviceData } from '../utils/Storage';
import { useHealthStore } from '../stores/healthStore';

type Palette = {
    screen: string;
    card: string;
    raised: string;
    subtle: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentSoft: string;
    danger: string;
    shadow: string;
};

const presetAccent: Record<ThemePreset, string> = {
    noir: '#FF2D7A',
    classic: '#1A73E8',
    earthy: '#6FA84F',
    punchy: '#F97316',
    studio: '#F8FAFC',
    solar: '#FACC15',
};

function makePalette(resolvedMode: 'dark' | 'light', preset: ThemePreset): Palette {
    const accent = presetAccent[preset];
    if (resolvedMode === 'dark') {
        return {
            screen: preset === 'earthy' ? '#11130F' : '#090B10',
            card: preset === 'earthy' ? '#191D15' : '#121722',
            raised: preset === 'earthy' ? '#22281D' : '#1A2230',
            subtle: preset === 'earthy' ? '#293120' : '#202A3A',
            text: '#F8FAFC',
            muted: '#A8B3C4',
            border: 'rgba(255,255,255,0.08)',
            accent,
            accentSoft: `${accent}26`,
            danger: '#F87171',
            shadow: '0 18px 48px rgba(0,0,0,0.34)',
        };
    }
    return {
        screen: preset === 'earthy' ? '#F4F7EF' : '#F8FAFC',
        card: '#FFFFFF',
        raised: preset === 'earthy' ? '#F7FAF2' : '#F8FAFC',
        subtle: preset === 'earthy' ? '#EAF1E1' : '#E2E8F0',
        text: '#0F172A',
        muted: '#64748B',
        border: '#E2E8F0',
        accent,
        accentSoft: `${accent}16`,
        danger: '#DC2626',
        shadow: '0 18px 42px rgba(15,23,42,0.06)',
    };
}

export default function Settings() {
    const router = useRouter();
    const { mode, resolvedMode, setMode } = useTheme();
    const preset = useThemeStore((state) => state.preset);
    const setPreset = useThemeStore((state) => state.setPreset);
    const units = useThemeStore((state) => state.units);
    const setUnits = useThemeStore((state) => state.setUnits);
    const hapticsEnabled = useThemeStore((state) => state.hapticsEnabled);
    const setHapticsEnabled = useThemeStore((state) => state.setHapticsEnabled);
    const liveWeatherEnabled = useThemeStore((state) => state.liveWeatherEnabled);
    const setLiveWeatherEnabled = useThemeStore((state) => state.setLiveWeatherEnabled);
    const reducedMotion = useThemeStore((state) => state.reducedMotion);
    const setReducedMotion = useThemeStore((state) => state.setReducedMotion);
    const palette = useMemo(() => makePalette(resolvedMode, preset), [preset, resolvedMode]);
    const styles = useMemo(() => createStyles(palette), [palette]);
    const sources = useHealthStore((state) => state.sources);
    const requestPermission = useHealthStore((state) => state.requestPermission);
    const disconnect = useHealthStore((state) => state.disconnect);
    const activeSource = sources.find((source) => source.connected) ?? sources[0];
    const healthSync = sources.some((source) => source.connected);
    const [message, setMessage] = useState('');

    const toggleHealth = async () => {
        const next = !healthSync;
        if (next) {
            await requestPermission(activeSource.id);
            setMessage(useHealthStore.getState().lastError ?? 'Health data sync is ready for this device.');
        } else {
            sources.forEach((source) => disconnect(source.id));
            setMessage('Health sync disabled for this device.');
        }
    };

    const clearCache = async () => {
        const removed = await clearAppCache();
        setMessage(removed ? `Cleared ${removed} cached item${removed === 1 ? '' : 's'}.` : 'Cache is already clean.');
    };

    const clearData = async () => {
        await clearLocalDeviceData();
        setMessage('Local device data cleared for this hardware namespace.');
    };

    return (
        <div style={styles.screen}>
            <main style={styles.main}>
                <header style={styles.topBar}>
                    <motion.button type="button" layout whileTap={{ scale: 0.95 }} style={styles.backButton} onClick={() => router.push('/profile' as never)}>
                        <ArrowLeft size={22} />
                    </motion.button>
                    <strong style={styles.topTitle}>Settings</strong>
                    <span style={{ width: 52 }} />
                </header>

                <section style={styles.card}>
                    <PreferenceBlock icon={resolvedMode === 'dark' ? <Moon size={21} /> : <Sun size={21} />} title="App Theme" copy="Choose light, dark, or follow the device." styles={styles}>
                        <div style={styles.segmentGrid}>
                            {(['light', 'dark', 'auto'] as ThemeMode[]).map((option) => (
                                <Pill key={option} active={mode === option} styles={styles} onClick={() => setMode(option)}>
                                    {option[0].toUpperCase() + option.slice(1)}
                                </Pill>
                            ))}
                        </div>
                    </PreferenceBlock>

                    <PreferenceBlock icon={<Palette size={21} />} title="Vibe" copy="Choose the visual energy for Cunningham Fitness." styles={styles}>
                        <div style={styles.presetGrid}>
                            {([
                                ['noir', 'Noir', '#FF2D7A'],
                                ['classic', 'Classic', '#1A73E8'],
                                ['studio', 'Studio', '#F8FAFC'],
                                ['earthy', 'Earthy', '#6FA84F'],
                                ['punchy', 'Punchy', '#F97316'],
                                ['solar', 'Solar', '#FACC15'],
                            ] as const).map(([id, label, accent]) => (
                                <motion.button
                                    key={id}
                                    type="button"
                                    layout
                                    whileTap={{ scale: 0.95 }}
                                    style={preset === id ? { ...styles.presetActive, color: accent } : styles.preset}
                                    onClick={() => setPreset(id as ThemePreset)}
                                >
                                    <span style={{ ...styles.swatch, background: accent }} />
                                    {label}
                                    {preset === id ? <Check size={16} /> : null}
                                </motion.button>
                            ))}
                        </div>
                    </PreferenceBlock>

                    <PreferenceBlock icon={<Ruler size={21} />} title="Units" copy="Choose how distance, pace, and body weight display." styles={styles}>
                        <div style={styles.segmentGridTwo}>
                            {(['metric', 'imperial'] as UnitSystem[]).map((option) => (
                                <Pill key={option} active={units === option} styles={styles} onClick={() => setUnits(option)}>
                                    {option === 'metric' ? 'Metric' : 'Imperial'}
                                </Pill>
                            ))}
                        </div>
                    </PreferenceBlock>
                </section>

                <section style={styles.card}>
                    <SettingRow styles={styles} icon={<HeartPulse size={21} />} title="Sync Apple Health / Health Connect" copy="Request clean watch data for steps, heart rate, workouts, and active energy." checked={healthSync} onClick={toggleHealth} />
                    <SettingRow styles={styles} icon={<MapPin size={21} />} title="Live Weather and Location" copy="Use device location for weather, running, and outdoor readiness." checked={liveWeatherEnabled} onClick={() => setLiveWeatherEnabled(!liveWeatherEnabled)} />
                    <SettingRow styles={styles} icon={<Zap size={21} />} title="Haptic Feedback" copy="Use light taps for navigation and workout controls." checked={hapticsEnabled} onClick={() => setHapticsEnabled(!hapticsEnabled)} />
                    <SettingRow styles={styles} icon={<Sparkles size={21} />} title="Reduce Motion" copy="Keep transitions subtle for a calmer interface." checked={reducedMotion} onClick={() => setReducedMotion(!reducedMotion)} />
                </section>

                <section style={styles.card}>
                    <ActionButton styles={styles} icon={<Database size={20} />} title="Clear App Cache" copy="Refresh weather, route previews, and local computed caches." onClick={clearCache} />
                    <ActionButton styles={styles} icon={<Bell size={20} />} title="Notification Preferences" copy="Open iOS notification controls if rest or workout alerts feel noisy." onClick={() => setMessage('Use iOS Settings > Notifications > Cunningham Fitness to adjust system alerts.')} />
                    <ActionButton styles={styles} icon={<Trash2 size={20} />} title="Clear Local Device Data" copy="Wipe local workouts, profile, and cached state for this device." onClick={clearData} danger />
                    {message ? <p style={styles.message}>{message}</p> : null}
                </section>
            </main>
        </div>
    );
}

function PreferenceBlock({ icon, title, copy, children, styles }: { icon: ReactNode; title: string; copy: string; children: ReactNode; styles: Record<string, CSSProperties> }) {
    return (
        <div style={styles.preferenceBlock}>
            <div style={styles.preferenceHead}>
                <span style={styles.rowIcon}>{icon}</span>
                <span>
                    <strong style={styles.rowTitle}>{title}</strong>
                    <span style={styles.rowCopy}>{copy}</span>
                </span>
            </div>
            {children}
        </div>
    );
}

function Pill({ active, children, styles, onClick }: { active: boolean; children: ReactNode; styles: Record<string, CSSProperties>; onClick: () => void }) {
    return (
        <motion.button type="button" layout whileTap={{ scale: 0.95 }} style={active ? styles.segmentActive : styles.segment} onClick={onClick}>
            {children}
        </motion.button>
    );
}

function SettingRow({ icon, title, copy, checked, onClick, styles }: { icon: ReactNode; title: string; copy: string; checked: boolean; onClick: () => void | Promise<void>; styles: Record<string, CSSProperties> }) {
    return (
        <div style={styles.row}>
            <span style={styles.rowIcon}>{icon}</span>
            <span style={styles.rowBody}>
                <strong style={styles.rowTitle}>{title}</strong>
                <span style={styles.rowCopy}>{copy}</span>
            </span>
            <motion.button type="button" layout whileTap={{ scale: 0.95 }} style={checked ? styles.switchOn : styles.switchOff} onClick={() => void onClick()}>
                <span style={checked ? styles.knobOn : styles.knobOff} />
            </motion.button>
        </div>
    );
}

function ActionButton({ icon, title, copy, onClick, danger = false, styles }: { icon: ReactNode; title: string; copy: string; onClick: () => void | Promise<void>; danger?: boolean; styles: Record<string, CSSProperties> }) {
    return (
        <motion.button type="button" layout whileTap={{ scale: 0.97 }} style={danger ? styles.actionDanger : styles.action} onClick={() => void onClick()}>
            <span style={danger ? styles.actionIconDanger : styles.actionIcon}>{icon}</span>
            <span style={styles.actionBody}>
                <strong style={danger ? styles.actionTitleDanger : styles.actionTitle}>{title}</strong>
                <span style={styles.rowCopy}>{copy}</span>
            </span>
        </motion.button>
    );
}

function createStyles(palette: Palette): Record<string, CSSProperties> {
    const card: CSSProperties = { background: palette.card, border: `1px solid ${palette.border}`, boxShadow: palette.shadow, borderRadius: 32 };
    return {
        screen: { height: '100dvh', minHeight: '100dvh', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', background: palette.screen, color: palette.text, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', WebkitOverflowScrolling: 'touch' },
        main: { width: '100%', maxWidth: 760, margin: '0 auto', padding: 'max(92px, calc(env(safe-area-inset-top) + 42px)) 16px calc(env(safe-area-inset-bottom) + 128px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 },
        topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        backButton: { width: 52, height: 52, borderRadius: 999, border: 0, background: palette.card, color: palette.text, display: 'grid', placeItems: 'center', boxShadow: palette.shadow },
        topTitle: { color: palette.text, fontSize: 18, fontWeight: 850 },
        card: { ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
        preferenceBlock: { borderRadius: 24, background: palette.raised, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 },
        preferenceHead: { display: 'flex', alignItems: 'center', gap: 12 },
        row: { display: 'flex', alignItems: 'center', gap: 12, borderRadius: 24, background: palette.raised, padding: 14 },
        rowIcon: { width: 46, height: 46, borderRadius: 999, background: palette.accentSoft, color: palette.accent, display: 'grid', placeItems: 'center', flexShrink: 0 },
        rowBody: { flex: 1, minWidth: 0 },
        rowTitle: { display: 'block', color: palette.text, fontSize: 16, fontWeight: 850 },
        rowCopy: { display: 'block', marginTop: 4, color: palette.muted, fontSize: 13, lineHeight: 1.35 },
        segmentGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
        segmentGridTwo: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
        segment: { minHeight: 42, border: 0, borderRadius: 999, background: palette.subtle, color: palette.muted, font: 'inherit', fontWeight: 850 },
        segmentActive: { minHeight: 42, border: 0, borderRadius: 999, background: palette.text, color: palette.screen, font: 'inherit', fontWeight: 850 },
        presetGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
        preset: { minHeight: 44, border: 0, borderRadius: 999, background: palette.subtle, color: palette.muted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: 'inherit', fontSize: 13, fontWeight: 850 },
        presetActive: { minHeight: 44, border: 0, borderRadius: 999, background: palette.card, boxShadow: `inset 0 0 0 1px ${palette.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: 'inherit', fontSize: 13, fontWeight: 900 },
        swatch: { width: 10, height: 10, borderRadius: 999 },
        switchOn: { width: 54, height: 32, border: 0, borderRadius: 999, background: palette.accent, padding: 3, flexShrink: 0 },
        switchOff: { width: 54, height: 32, border: 0, borderRadius: 999, background: palette.subtle, padding: 3, flexShrink: 0 },
        knobOn: { display: 'block', width: 26, height: 26, borderRadius: 999, background: '#fff', marginLeft: 22 },
        knobOff: { display: 'block', width: 26, height: 26, borderRadius: 999, background: '#fff' },
        action: { border: 0, borderRadius: 24, background: palette.raised, color: palette.text, padding: 14, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, font: 'inherit' },
        actionDanger: { border: 0, borderRadius: 24, background: palette.raised, color: palette.danger, padding: 14, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, font: 'inherit' },
        actionIcon: { width: 46, height: 46, borderRadius: 999, background: palette.accentSoft, color: palette.accent, display: 'grid', placeItems: 'center', flexShrink: 0 },
        actionIconDanger: { width: 46, height: 46, borderRadius: 999, background: `${palette.danger}16`, color: palette.danger, display: 'grid', placeItems: 'center', flexShrink: 0 },
        actionBody: { minWidth: 0 },
        actionTitle: { display: 'block', color: palette.text, fontSize: 16, fontWeight: 850 },
        actionTitleDanger: { display: 'block', color: palette.danger, fontSize: 16, fontWeight: 850 },
        message: { margin: 0, color: palette.muted, fontSize: 13, lineHeight: 1.4 },
    };
}
