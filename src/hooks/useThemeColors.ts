import { useColorScheme } from 'react-native';
import { darkColors, lightColors, gradients, lightGradients } from '../theme/colors';
import { useThemeStore } from '../stores/themeStore';

export function useThemeColors() {
    const { mode } = useThemeStore();
    const systemScheme = useColorScheme();

    const isDark =
        mode === 'dark' ||
        (mode === 'auto' && systemScheme !== 'light');

    return {
        colors: isDark ? darkColors : lightColors,
        gradients: isDark ? gradients : lightGradients,
        isDark,
    };
}
