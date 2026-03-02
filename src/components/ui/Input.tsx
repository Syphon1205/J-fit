import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../theme';

interface InputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    error?: string;
    style?: ViewStyle;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    error,
    style,
    icon,
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <View
                style={[
                    styles.inputWrapper,
                    isFocused && styles.inputFocused,
                    error ? styles.inputError : null,
                ]}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    selectionColor={colors.primary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
    },
    inputFocused: {
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    inputError: {
        borderColor: colors.error,
    },
    iconContainer: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.textPrimary,
        paddingVertical: spacing.md + 2,
    },
    errorText: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
    },
});
