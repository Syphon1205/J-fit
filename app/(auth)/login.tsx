import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';

export default function LoginScreen() {
    const { loginWithGoogle, loginWithApple, loginWithGithub, continueAsGuest, initDeviceIdentity, authError } = useAuthStore();
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | 'github' | 'guest' | null>(null);
    const fade = useRef(new Animated.Value(0)).current;
    const rise = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
            Animated.timing(rise, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]).start();

        initDeviceIdentity();
    }, [fade, rise]);

    const handleGoogle = async () => {
        setSocialLoading('google');
        await loginWithGoogle();
        setSocialLoading(null);
    };

    const handleApple = async () => {
        setSocialLoading('apple');
        await loginWithApple();
        setSocialLoading(null);
    };

    const handleGithub = async () => {
        setSocialLoading('github');
        await loginWithGithub();
        setSocialLoading(null);
    };

    const handleGuest = async () => {
        setSocialLoading('guest');
        await continueAsGuest();
        setSocialLoading(null);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.animatedShell, { opacity: fade, transform: [{ translateY: rise }] }]}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentInsetAdjustmentBehavior="automatic"
                    bounces
                >
                {/* Logo */}
                <View style={styles.logoSection}>
                    <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
                        <Ionicons name="fitness" size={36} color={colors.textInverse} />
                    </LinearGradient>
                    <Text style={styles.appName}>Cunningham Fitness</Text>
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

                    <TouchableOpacity style={styles.githubBtn} onPress={handleGithub} activeOpacity={0.85}>
                        {socialLoading === 'github'
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <><Ionicons name="logo-github" size={20} color="#fff" /><Text style={styles.githubBtnText}>Continue with GitHub</Text></>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.85}>
                        {socialLoading === 'guest'
                            ? <ActivityIndicator color={colors.textPrimary} size="small" />
                            : <><Ionicons name="person-outline" size={20} color={colors.textPrimary} /><Text style={styles.guestBtnText}>Continue as Guest</Text></>}
                    </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
                {!!authError && <Text style={styles.authError}>{authError}</Text>}
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    animatedShell: { flex: 1 },
    scroll: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: spacing.xxl, justifyContent: 'center', paddingVertical: spacing.xxxl },
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
        marginBottom: spacing.md,
    },
    appleBtnText: { ...typography.bodyBold, color: '#fff' },
    githubBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
        backgroundColor: '#24292e', borderRadius: borderRadius.lg, paddingVertical: 16,
        borderWidth: 1, borderColor: '#3a3f45', marginBottom: spacing.md,
    },
    githubBtnText: { ...typography.bodyBold, color: '#fff' },
    guestBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
        backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingVertical: 16,
        borderWidth: 1, borderColor: colors.border,
    },
    guestBtnText: { ...typography.bodyBold, color: colors.textPrimary },
    disclaimer: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: spacing.md },
    authError: { ...typography.caption, color: colors.error, textAlign: 'center', marginTop: spacing.sm },
});
