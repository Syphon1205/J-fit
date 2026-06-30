import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, borderRadius, spacing } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { getPresetColors } from '../../theme/presets';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    style,
}) => {
    const { preset } = useThemeStore();
    const presetAccent = getPresetColors(preset);
    const sizeStyles = sizeMap[size];

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[styles.base, style]}
            >
                <LinearGradient
                    colors={disabled ? ['#333', '#333'] : [presetAccent.primary, presetAccent.primaryDim]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.gradient, sizeStyles.container]}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.textInverse} size="small" />
                    ) : (
                        <>
                            {icon}
                            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[styles.textPrimary, sizeStyles.text]}>{title}</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.base,
                variantStyles[variant]?.container,
                sizeStyles.container,
                disabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'ghost' ? presetAccent.primary : colors.textPrimary}
                    size="small"
                />
            ) : (
                <>
                    {icon}
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                            variantStyles[variant]?.text,
                            variant === 'ghost' ? { color: presetAccent.primary } : null,
                            sizeStyles.text,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const sizeMap: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    sm: {
        container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
        text: { ...typography.caption, fontWeight: '600' },
    },
    md: {
        container: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
        text: { ...typography.callout, fontWeight: '600' },
    },
    lg: {
        container: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
        text: { ...typography.body, fontWeight: '600' },
    },
};

const variantStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
    secondary: {
        container: {
            backgroundColor: colors.surfaceLight,
        },
        text: {
            color: colors.textPrimary,
            textAlign: 'center',
        },
    },
    ghost: {
        container: {
            backgroundColor: 'transparent',
        },
        text: {
            color: colors.primary,
            textAlign: 'center',
        },
    },
    outline: {
        container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.borderLight,
        },
        text: {
            color: colors.textPrimary,
            textAlign: 'center',
        },
    },
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    textPrimary: {
        color: colors.textInverse,
        fontWeight: '700',
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});
