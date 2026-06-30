import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useThemeStore, type ThemeMode, type ThemePreset } from '../stores/themeStore';

type ThemeContextValue = {
    mode: ThemeMode;
    resolvedMode: 'dark' | 'light';
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveMode(mode: ThemeMode): 'dark' | 'light' {
    if (mode !== 'auto') return mode;
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const presetAccent: Record<ThemePreset, { accent: string; secondary: string; bgDark: string; cardDark: string; navDark: string; bgLight: string }> = {
    noir: { accent: '#FF2D7A', secondary: '#F97316', bgDark: '#070609', cardDark: '#111015', navDark: '#101013', bgLight: '#FFF7FA' },
    classic: { accent: '#1A73E8', secondary: '#00BFA5', bgDark: '#090B10', cardDark: '#121722', navDark: '#0D111A', bgLight: '#F8FAFC' },
    earthy: { accent: '#6FA84F', secondary: '#C2A878', bgDark: '#11130F', cardDark: '#191D15', navDark: '#141811', bgLight: '#F4F7EF' },
    punchy: { accent: '#F97316', secondary: '#0EA5E9', bgDark: '#090B10', cardDark: '#121722', navDark: '#0D111A', bgLight: '#F8FAFC' },
    studio: { accent: '#F8FAFC', secondary: '#38BDF8', bgDark: '#050505', cardDark: '#111111', navDark: '#0A0A0A', bgLight: '#F8FAFC' },
    solar: { accent: '#FACC15', secondary: '#14B8A6', bgDark: '#10100A', cardDark: '#19170F', navDark: '#14130C', bgLight: '#FFFBEB' },
};

function themeVariables(resolvedMode: 'dark' | 'light', preset: ThemePreset): Record<string, string> {
    const accents = presetAccent[preset] ?? presetAccent.classic;
    if (resolvedMode === 'dark') {
        return {
            '--app-bg': accents.bgDark ?? (preset === 'earthy' ? '#11130F' : '#090B10'),
            '--app-card': accents.cardDark ?? (preset === 'earthy' ? '#191D15' : '#121722'),
            '--app-raised': preset === 'earthy' ? '#22281D' : '#1A2230',
            '--app-muted-surface': preset === 'earthy' ? '#293120' : '#202A3A',
            '--app-text': '#F8FAFC',
            '--app-heading': '#FFFFFF',
            '--app-muted': '#A8B3C4',
            '--app-border': 'rgba(255,255,255,0.10)',
            '--app-accent': accents.accent,
            '--app-secondary': accents.secondary,
            '--app-accent-soft': `${accents.accent}24`,
            '--app-secondary-soft': `${accents.secondary}24`,
            '--app-shadow': '0 18px 48px rgba(0,0,0,0.34)',
            '--app-nav-bg': accents.navDark ?? (preset === 'earthy' ? '#141811' : '#0D111A'),
            '--app-hero': `radial-gradient(circle at 50% 100%, ${accents.accent}66 0%, ${accents.secondary}44 34%, transparent 72%)`,
        };
    }

    return {
        '--app-bg': accents.bgLight ?? (preset === 'earthy' ? '#F4F7EF' : '#F8FAFC'),
        '--app-card': '#FFFFFF',
        '--app-raised': preset === 'earthy' ? '#F7FAF2' : '#F8FAFC',
        '--app-muted-surface': preset === 'earthy' ? '#EAF1E1' : '#E2E8F0',
        '--app-text': '#1E293B',
        '--app-heading': '#0F172A',
        '--app-muted': '#64748B',
        '--app-border': preset === 'earthy' ? '#DDE8D2' : '#E2E8F0',
        '--app-accent': accents.accent,
        '--app-secondary': accents.secondary,
        '--app-accent-soft': `${accents.accent}14`,
        '--app-secondary-soft': `${accents.secondary}14`,
        '--app-shadow': '0 18px 42px rgba(15,23,42,0.06)',
        '--app-nav-bg': '#FFFFFF',
        '--app-hero': `radial-gradient(circle at 50% 100%, ${accents.accent}28 0%, ${accents.secondary}20 36%, transparent 72%)`,
    };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const mode = useThemeStore((state) => state.mode);
    const preset = useThemeStore((state) => state.preset);
    const setMode = useThemeStore((state) => state.setMode);
    const resolvedMode = resolveMode(mode);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('dark', resolvedMode === 'dark');
        document.documentElement.style.colorScheme = resolvedMode;
        document.documentElement.dataset.themeMode = resolvedMode;
        document.documentElement.dataset.themePreset = preset;
        const variables = themeVariables(resolvedMode, preset);
        Object.entries(variables).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    }, [preset, resolvedMode]);

    const value = useMemo<ThemeContextValue>(() => ({
        mode,
        resolvedMode,
        setMode,
        toggleTheme: () => setMode(resolvedMode === 'dark' ? 'light' : 'dark'),
    }), [mode, resolvedMode, setMode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const value = useContext(ThemeContext);
    if (!value) throw new Error('useTheme must be used within ThemeProvider');
    return value;
}
