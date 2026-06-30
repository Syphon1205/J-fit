import { ThemePreset } from '../stores/themeStore';

export interface PresetColors {
    primary: string;
    primaryDim: string;
    secondary: string;
    tertiary: string;
}

export const presetColors: Record<ThemePreset, PresetColors> = {
    noir: {
        primary: '#FF2D7A',
        primaryDim: '#B5175A',
        secondary: '#F97316',
        tertiary: '#F8FAFC',
    },
    classic: {
        primary: '#00E5C7',
        primaryDim: '#00B89E',
        secondary: '#A78BFA',
        tertiary: '#FF6B9D',
    },
    punchy: {
        primary: '#F97316',
        primaryDim: '#EA580C',
        secondary: '#0EA5E9',
        tertiary: '#EC4899',
    },
    earthy: {
        primary: '#6FA84F',
        primaryDim: '#5B8E40',
        secondary: '#C2A878',
        tertiary: '#8D6E63',
    },
    studio: {
        primary: '#F8FAFC',
        primaryDim: '#CBD5E1',
        secondary: '#38BDF8',
        tertiary: '#FB7185',
    },
    solar: {
        primary: '#FACC15',
        primaryDim: '#EAB308',
        secondary: '#14B8A6',
        tertiary: '#F43F5E',
    },
};

export function getPresetColors(preset: ThemePreset): PresetColors {
    return presetColors[preset] ?? presetColors.classic;
}
