export const darkColors = {
    // Backgrounds
    background: '#080808',
    surface: '#101010',
    surfaceLight: '#171717',
    surfaceHover: '#1E1E1E',

    // Primary accent - electric teal
    primary: '#00E5C7',
    primaryDim: '#00B89E',
    primaryGlow: 'rgba(0, 229, 199, 0.15)',

    // Secondary accent - soft lavender
    secondary: '#A78BFA',
    secondaryDim: '#8B6FE0',
    secondaryGlow: 'rgba(167, 139, 250, 0.15)',

    // Tertiary - warm coral
    tertiary: '#FF6B9D',
    tertiaryDim: '#E05580',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#A3A3A3',
    textTertiary: '#737373',
    textInverse: '#0D0D0D',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Activity ring colors
    ringMove: '#FF2D55',
    ringExercise: '#00E5C7',
    ringStand: '#A78BFA',

    // Chart colors
    chart1: '#00E5C7',
    chart2: '#A78BFA',
    chart3: '#FF6B9D',
    chart4: '#3B82F6',
    chart5: '#F59E0B',

    // Borders
    border: 'rgba(255, 255, 255, 0.10)',
    borderLight: 'rgba(255, 255, 255, 0.18)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.6)',
    glass: 'rgba(16, 16, 16, 0.85)',
};

export const lightColors = {
    // Backgrounds
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceLight: '#F1F5F9',
    surfaceHover: '#E2E8F0',

    // Enterprise health accents
    primary: '#1A73E8',
    primaryDim: '#1557B0',
    primaryGlow: 'rgba(26, 115, 232, 0.12)',

    secondary: '#00BFA5',
    secondaryDim: '#009E8B',
    secondaryGlow: 'rgba(0, 191, 165, 0.12)',

    tertiary: '#8B5CF6',
    tertiaryDim: '#6D45D6',

    // Text
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',

    // Status (same as dark)
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',

    // Activity ring colors
    ringMove: '#1A73E8',
    ringExercise: '#00BFA5',
    ringStand: '#8B5CF6',

    // Chart colors
    chart1: '#1A73E8',
    chart2: '#00BFA5',
    chart3: '#8B5CF6',
    chart4: '#38BDF8',
    chart5: '#D97706',

    // Borders
    border: 'rgba(0, 0, 0, 0.08)',
    borderLight: 'rgba(0, 0, 0, 0.15)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.4)',
    glass: 'rgba(255, 255, 255, 0.85)',
};

type PersistedTheme = {
    mode?: 'dark' | 'light' | 'auto';
    preset?: 'noir' | 'classic' | 'punchy' | 'earthy' | 'studio' | 'solar' | 'fitness';
};

const presetAccents = {
    noir: {
        primary: '#FF2D7A',
        primaryDim: '#B5175A',
        secondary: '#F97316',
        secondaryDim: '#EA580C',
        tertiary: '#F8FAFC',
        tertiaryDim: '#CBD5E1',
    },
    classic: {
        primary: '#00E5C7',
        primaryDim: '#00B89E',
        secondary: '#A78BFA',
        secondaryDim: '#8B6FE0',
        tertiary: '#FF6B9D',
        tertiaryDim: '#E05580',
    },
    punchy: {
        primary: '#F97316',
        primaryDim: '#EA580C',
        secondary: '#0EA5E9',
        secondaryDim: '#0284C7',
        tertiary: '#EC4899',
        tertiaryDim: '#DB2777',
    },
    earthy: {
        primary: '#6FA84F',
        primaryDim: '#5B8E40',
        secondary: '#C2A878',
        secondaryDim: '#A88E61',
        tertiary: '#8D6E63',
        tertiaryDim: '#75574E',
    },
    studio: {
        primary: '#F8FAFC',
        primaryDim: '#CBD5E1',
        secondary: '#38BDF8',
        secondaryDim: '#0284C7',
        tertiary: '#FB7185',
        tertiaryDim: '#E11D48',
    },
    solar: {
        primary: '#FACC15',
        primaryDim: '#EAB308',
        secondary: '#14B8A6',
        secondaryDim: '#0F766E',
        tertiary: '#F43F5E',
        tertiaryDim: '#E11D48',
    },
} as const;

const readPersistedTheme = (): PersistedTheme => {
    try {
        const raw = globalThis?.localStorage?.getItem?.('jfit-theme');
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed?.state || {};
    } catch {
        return {};
    }
};

const persistedTheme = readPersistedTheme();
const prefersDark = typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
    : false;
const isLight = persistedTheme.mode === 'dark'
    ? false
    : persistedTheme.mode === 'auto'
        ? !prefersDark
        : true;
const normalizedPreset = persistedTheme.preset === 'fitness' ? 'punchy' : persistedTheme.preset;
const activePreset = normalizedPreset && presetAccents[normalizedPreset]
    ? normalizedPreset
    : 'noir';
const activeAccent = {
    ...presetAccents[activePreset],
    ...(activePreset === 'classic'
        ? {
            primary: '#1A73E8',
            primaryDim: '#1557B0',
            secondary: '#00BFA5',
            secondaryDim: '#009E8B',
            tertiary: '#8B5CF6',
            tertiaryDim: '#6D45D6',
        }
        : {}),
};

const applyAccent = <T extends typeof darkColors | typeof lightColors>(base: T) => ({
    ...base,
    primary: activeAccent.primary,
    primaryDim: activeAccent.primaryDim,
    primaryGlow: `${activeAccent.primary}26`,
    secondary: activeAccent.secondary,
    secondaryDim: activeAccent.secondaryDim,
    secondaryGlow: `${activeAccent.secondary}26`,
    tertiary: activeAccent.tertiary,
    tertiaryDim: activeAccent.tertiaryDim,
    ringMove: activeAccent.tertiary,
    ringExercise: activeAccent.primary,
    ringStand: activeAccent.secondary,
    chart1: activeAccent.primary,
    chart2: activeAccent.secondary,
    chart3: activeAccent.tertiary,
});

// Global tokens used by existing screens/styles
export const colors = applyAccent(isLight ? lightColors : darkColors);

export const gradients = {
    primary: [activeAccent.primary, activeAccent.primaryDim] as const,
    secondary: [activeAccent.secondary, activeAccent.secondaryDim] as const,
    tertiary: [activeAccent.tertiary, activeAccent.tertiaryDim] as const,
    surface: isLight ? (['#FFFFFF', '#F5F5F7'] as const) : (['#101010', '#171717'] as const),
    dark: isLight ? (['#F5F5F7', '#FFFFFF'] as const) : (['#080808', '#101010'] as const),
    cardGlow: [`${activeAccent.primary}0D`, `${activeAccent.secondary}0D`] as const,
};

export const lightGradients = {
    primary: ['#00C5AB', '#009E8B'] as const,
    secondary: ['#7C5CF6', '#6344D6'] as const,
    tertiary: ['#E8547A', '#C83D62'] as const,
    surface: ['#FFFFFF', '#F5F5F7'] as const,
    dark: ['#F5F5F7', '#FFFFFF'] as const,
    cardGlow: ['rgba(0, 197, 171, 0.04)', 'rgba(124, 92, 246, 0.04)'] as const,
};
