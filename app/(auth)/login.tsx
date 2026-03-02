import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';

export default function LoginScreen() {
    const router = useRouter();
    const { loginWithGoogle, loginWithApple } = useAuthStore();
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

    const handleGoogle = async () => {
        setSocialLoading('google');
        await loginWithGoogle();
        setSocialLoading(null);
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) router.replace('/(tabs)');
    };

    const handleApple = async () => {
        setSocialLoading('apple');
        await loginWithApple();
        setSocialLoading(null);
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoSection}>
                    <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
                        <Ionicons name="fitness" size={36} color={colors.textInverse} />
                    </LinearGradient>
                    <Text style={styles.appName}>J-Fit</Text>
                    <Text style={styles.tagline}>Your fitness journey starts here</Text>
                </View>

                {/* OAuth Sign In */}
                <View style={styles.authButtons}>
                    <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.85}>
                        {socialLoading === 'google'
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <><Ionicons name="logo-google" size={20} color="#fff" /><Text style={styles.googleBtnText}>Continue with Google</Text></>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.appleBtn} onPress={handleApple} activeOpacity={0.85}>
                        {socialLoading === 'apple'
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <><Ionicons name="logo-apple" size={20} color="#fff" /><Text style={styles.appleBtnText}>Continue with Apple</Text></>}
                    </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: spacing.xxl, justifyContent: 'center', paddingVertical: spacing.xxxl },
    logoSection: { alignItems: 'center', marginBottom: spacing.xxxxl },
    logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    appName: { ...typography.display, color: colors.textPrimary },
    tagline: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs },
    authButtons: { marginBottom: spacing.xl },
    googleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
        backgroundColor: '#4285F4', borderRadius: borderRadius.lg, paddingVertical: 16,
        marginBottom: spacing.md,
    },
    googleBtnText: { ...typography.bodyBold, color: '#fff' },
    appleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
        backgroundColor: '#1D1D1F', borderRadius: borderRadius.lg, paddingVertical: 16,
        borderWidth: 1, borderColor: colors.border,
    },
    appleBtnText: { ...typography.bodyBold, color: '#fff' },
    disclaimer: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: spacing.md },
});
