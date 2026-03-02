export const darkColors = {
    // Backgrounds
    background: '#0D0D0D',
    surface: '#1A1A2E',
    surfaceLight: '#232340',
    surfaceHover: '#2A2A4A',

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
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
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
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.15)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.6)',
    glass: 'rgba(26, 26, 46, 0.8)',
};

export const lightColors = {
    // Backgrounds
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceLight: '#F0F0F5',
    surfaceHover: '#E8E8F0',

    // Primary accent - electric teal (same brand, works on light too)
    primary: '#00C5AB',
    primaryDim: '#009E8B',
    primaryGlow: 'rgba(0, 197, 171, 0.12)',

    // Secondary accent - soft lavender
    secondary: '#7C5CF6',
    secondaryDim: '#6344D6',
    secondaryGlow: 'rgba(124, 92, 246, 0.12)',

    // Tertiary - warm coral
    tertiary: '#E8547A',
    tertiaryDim: '#C83D62',

    // Text
    textPrimary: '#0D0D1A',
    textSecondary: '#4B5563',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Status (same as dark)
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',

    // Activity ring colors
    ringMove: '#E8547A',
    ringExercise: '#00C5AB',
    ringStand: '#7C5CF6',

    // Chart colors
    chart1: '#00C5AB',
    chart2: '#7C5CF6',
    chart3: '#E8547A',
    chart4: '#2563EB',
    chart5: '#D97706',

    // Borders
    border: 'rgba(0, 0, 0, 0.08)',
    borderLight: 'rgba(0, 0, 0, 0.15)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.4)',
    glass: 'rgba(255, 255, 255, 0.85)',
};

// Default export stays dark for backward compat with any remaining direct imports
export const colors = darkColors;

export const gradients = {
    primary: ['#00E5C7', '#00B89E'] as const,
    secondary: ['#A78BFA', '#8B6FE0'] as const,
    tertiary: ['#FF6B9D', '#E05580'] as const,
    surface: ['#1A1A2E', '#16213E'] as const,
    dark: ['#0D0D0D', '#1A1A2E'] as const,
    cardGlow: ['rgba(0, 229, 199, 0.05)', 'rgba(167, 139, 250, 0.05)'] as const,
};

export const lightGradients = {
    primary: ['#00C5AB', '#009E8B'] as const,
    secondary: ['#7C5CF6', '#6344D6'] as const,
    tertiary: ['#E8547A', '#C83D62'] as const,
    surface: ['#FFFFFF', '#F5F5F7'] as const,
    dark: ['#F5F5F7', '#FFFFFF'] as const,
    cardGlow: ['rgba(0, 197, 171, 0.04)', 'rgba(124, 92, 246, 0.04)'] as const,
};
