import { useColorScheme } from 'react-native';
import { darkColors, lightColors, gradients, lightGradients } from '../theme/colors';
import { useThemeStore } from '../stores/themeStore';
import { getPresetColors } from '../theme/presets';

export function useThemeColors() {
    const { mode, preset } = useThemeStore();
    const systemScheme = useColorScheme();

    const isDark =
        mode === 'dark' ||
        (mode === 'auto' && systemScheme !== 'light');

    const baseColors = isDark ? darkColors : lightColors;
    const baseGradients = isDark ? gradients : lightGradients;
    const presetAccent = getPresetColors(preset);

    return {
        colors: {
            ...baseColors,
            primary: presetAccent.primary,
            primaryDim: presetAccent.primaryDim,
            secondary: presetAccent.secondary,
            tertiary: presetAccent.tertiary,
            ringExercise: presetAccent.primary,
            ringStand: presetAccent.secondary,
            ringMove: presetAccent.tertiary,
            chart1: presetAccent.primary,
            chart2: presetAccent.secondary,
            chart3: presetAccent.tertiary,
        },
        gradients: {
            ...baseGradients,
            primary: [presetAccent.primary, presetAccent.primaryDim] as const,
            secondary: [presetAccent.secondary, presetAccent.secondary] as const,
            tertiary: [presetAccent.tertiary, presetAccent.tertiary] as const,
        },
        isDark,
    };
}
