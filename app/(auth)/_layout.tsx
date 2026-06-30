import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { colors } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';

export default function AuthLayout() {
    const { isAuthenticated, onboardingCompleted, hasHydrated } = useAuthStore();

    if (!hasHydrated) {
        return null;
    }

    if (isAuthenticated && onboardingCompleted) {
        return <Redirect href="/(tabs)" />;
    }

    if (isAuthenticated && !onboardingCompleted) {
        return <Redirect href="/onboarding/welcome" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
        </Stack>
    );
}
