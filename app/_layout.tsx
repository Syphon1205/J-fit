import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme';
import { useAuthStore } from '../src/stores/authStore';

function AuthGate({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const inAuthGroup = segments[0] === '(auth)';
        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments]);

    return <>{children}</>;
}

export default function RootLayout() {
    return (
        <>
            <StatusBar style="light" />
            <AuthGate>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="workout/[id]" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="workout/timer" options={{ presentation: 'fullScreenModal' }} />
                    <Stack.Screen name="settings/connections" />
                    <Stack.Screen name="settings/notifications" />
                    <Stack.Screen name="settings/appearance" />
                    <Stack.Screen name="settings/export" />
                    <Stack.Screen name="settings/privacy" />
                    <Stack.Screen name="settings/help" />
                    <Stack.Screen name="notifications" />
                    <Stack.Screen name="progress/add-weight" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="nutrition/log-meal" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="challenges" />
                </Stack>
            </AuthGate>
        </>
    );
}
