import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'glow' | 'flat';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
    return (
        <View style={[styles.base, variantStyles[variant], style]}>
            {children}
        </View>
    );
};

const variantStyles: Record<string, ViewStyle> = {
    default: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    glow: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 199, 0.2)',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    flat: {
        backgroundColor: colors.surface,
    },
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
});
