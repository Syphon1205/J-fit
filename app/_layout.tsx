import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { colors } from '../src/theme';
import { useAuthStore } from '../src/stores/authStore';
import { ThemeProvider } from '../src/contexts/ThemeProvider';
import { getDeviceNamespace } from '../src/utils/Storage';
import { initWidgetSync } from '../src/utils/widgetBridge';

export default function RootLayout() {
    const { hasHydrated, setHasHydrated } = useAuthStore();

    useEffect(() => {
        if (hasHydrated) return;

        const fallback = setTimeout(() => {
            setHasHydrated(true);
        }, 1800);

        return () => clearTimeout(fallback);
    }, [hasHydrated, setHasHydrated]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        try {
            (globalThis as any).__APP_READY__ = true;
            const fallback = globalThis.document?.getElementById?.('boot-fallback');
            if (fallback) fallback.remove();
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        let handle: { remove: () => Promise<void> } | null = null;

        const recoverWebView = () => {
            if (typeof document === 'undefined' || typeof window === 'undefined') return;
            const root = document.getElementById('root');
            document.documentElement.style.background = '#000000';
            document.body.style.background = '#000000';
            document.body.style.pointerEvents = '';
            root?.style.removeProperty('pointer-events');

            const bodyHeight = document.body?.getBoundingClientRect?.().height ?? 0;
            const rootHeight = root?.getBoundingClientRect?.().height ?? 0;
            const rootIsEmpty = !root || root.childElementCount === 0 || (root.textContent ?? '').trim().length === 0;

            if (rootIsEmpty || bodyHeight === 0 || rootHeight === 0) {
                window.location.reload();
            }
        };

        CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) return;
            window.setTimeout(recoverWebView, 80);
            window.setTimeout(recoverWebView, 650);
        })
            .then((listener) => {
                handle = listener;
            })
            .catch(() => undefined);

        return () => {
            void handle?.remove();
        };
    }, []);

    useEffect(() => {
        if (!hasHydrated) return;
        void getDeviceNamespace().catch(() => undefined);
        void SplashScreen.hide().catch(() => undefined);
        
        if (Platform.OS !== 'web') {
            initWidgetSync();
        }
    }, [hasHydrated]);

    return (
        <ThemeProvider>
            <StatusBar style="light" />
            <View style={styles.rootShell}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                        fullScreenGestureEnabled: true,
                        gestureDirection: 'horizontal',
                    }}
                >
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="onboarding/welcome" options={{ animation: 'fade' }} />
                    <Stack.Screen name="workout/[id]" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="workout/trainer-videos" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="workout/timer" options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="workout/record" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="settings/connections" />
                    <Stack.Screen name="settings/notifications" />
                    <Stack.Screen name="settings/appearance" />
                    <Stack.Screen name="settings/export" />
                    <Stack.Screen name="settings/privacy" />
                    <Stack.Screen name="settings/privacy-policy" />
                    <Stack.Screen name="settings/profile" />
                    <Stack.Screen name="settings/help" />
                    <Stack.Screen name="notifications" />
                    <Stack.Screen name="progress/add-weight" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="challenges" />
                    <Stack.Screen name="active-workout" options={{ presentation: 'fullScreenModal' }} />
                </Stack>
                {!hasHydrated && (
                    <View style={styles.loadingOverlay} pointerEvents="auto">
                        <View style={styles.loadingContent}>
                            <View style={styles.logoPulse}>
                                <Text style={styles.logoText}>CF</Text>
                            </View>
                            <Text style={styles.loadingTitle}>Loading</Text>
                            <Text style={styles.loadingSubtitle}>Getting your coaching workspace ready...</Text>
                            <ActivityIndicator color={colors.primary} style={{ marginTop: 18 }} />
                        </View>
                    </View>
                )}
            </View>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    rootShell: {
        flex: 1,
        backgroundColor: colors.background,
        minHeight: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
        backgroundColor: colors.background,
    },
    loadingContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoPulse: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: colors.primaryGlow,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary + '50',
    },
    logoText: {
        color: colors.primary,
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
    },
    loadingTitle: {
        color: colors.textPrimary,
        fontSize: 28,
        fontWeight: '800',
        marginTop: 16,
    },
    loadingSubtitle: {
        color: colors.textSecondary,
        fontSize: 15,
        marginTop: 8,
        textAlign: 'center',
    },
});
