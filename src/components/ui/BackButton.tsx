import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../theme';
import { safeBack } from '../../utils/navigation';

type BackButtonProps = {
    onPress?: () => void;
    fallback?: string;
};

export function BackButton({ onPress, fallback = '/' }: BackButtonProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
            onPress={onPress || (() => safeBack(router, fallback))}
            style={styles.button}
        >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
