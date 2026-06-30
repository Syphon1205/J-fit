import React from 'react';
import { Redirect, Slot, Tabs } from 'expo-router';
import { Platform, View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { BottomNav } from '../../src/components/BottomNav';
import AppLayout from '../../src/components/AppLayout';

export default function TabLayout() {
    const { isAuthenticated, onboardingCompleted, hasHydrated } = useAuthStore();

    if (!hasHydrated) {
        return (
            <View style={styles.loadingWrap}>
                <View style={styles.loadingCard}>
                    <Text style={styles.loadingTitle}>Cunningham Fitness</Text>
                    <Text style={styles.loadingSub}>Loading your dashboard…</Text>
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
                </View>
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    if (!onboardingCompleted) {
        return <Redirect href="/onboarding/welcome" />;
    }

    if (Platform.OS === 'web') {
        return (
            <AppLayout>
                <Slot />
            </AppLayout>
        );
    }

    return (
        <Tabs
            tabBar={(props) => <BottomNav {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconWrap}>
                            {focused && (
                                <LinearGradient
                                    colors={[colors.primary + '55', colors.secondary + '22']}
                                    style={styles.iconGlow}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="workouts"
                options={{
                    title: 'Workouts',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconWrap}>
                            {focused && (
                                <LinearGradient
                                    colors={[colors.primary + '55', colors.secondary + '22']}
                                    style={styles.iconGlow}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="progress"
                options={{
                    title: 'Progress',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconWrap}>
                            {focused && (
                                <LinearGradient
                                    colors={[colors.primary + '55', colors.secondary + '22']}
                                    style={styles.iconGlow}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="nutrition"
                options={{
                    href: null,
                    title: 'Nutrition',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconWrap}>
                            {focused && (
                                <LinearGradient
                                    colors={[colors.primary + '55', colors.secondary + '22']}
                                    style={styles.iconGlow}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <Ionicons name={focused ? 'nutrition' : 'nutrition-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Analytics',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconWrap}>
                            {focused && (
                                <LinearGradient
                                    colors={[colors.primary + '55', colors.secondary + '22']}
                                    style={styles.iconGlow}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconWrap}>
                            {focused && (
                                <LinearGradient
                                    colors={[colors.primary + '55', colors.secondary + '22']}
                                    style={styles.iconGlow}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            )}
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    loadingWrap: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    loadingCard: {
        backgroundColor: colors.glass,
        borderRadius: 24,
        borderWidth: 0,
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: 'center',
    },
    loadingTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    loadingSub: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 6,
    },
    iconWrap: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 19,
    },
});
