import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { getPresetColors } from '../../theme/presets';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'glow' | 'flat';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
    const { preset } = useThemeStore();
    const presetAccent = getPresetColors(preset);

    return (
        <View
            style={[
                styles.base,
                variantStyles[variant],
                variant === 'glow'
                    ? {
                        shadowColor: presetAccent.primary,
                        shadowOpacity: 0.18,
                        borderWidth: 0,
                    }
                    : null,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const variantStyles: Record<string, ViewStyle> = {
    default: {
        backgroundColor: colors.glass,
        borderWidth: 0,
    },
    glow: {
        backgroundColor: colors.glass,
        borderWidth: 0,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 26,
        elevation: 10,
    },
    flat: {
        backgroundColor: colors.glass,
        borderWidth: 0,
    },
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.26,
        shadowRadius: 22,
        elevation: 10,
    },
});
