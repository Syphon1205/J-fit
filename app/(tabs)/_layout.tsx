import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../src/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textTertiary,
                tabBarLabelStyle: styles.tabLabel,
                tabBarShowLabel: true,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIcon : undefined}>
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
                        <View style={focused ? styles.activeIcon : undefined}>
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
                        <View style={focused ? styles.activeIcon : undefined}>
                            <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="nutrition"
                options={{
                    title: 'Nutrition',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIcon : undefined}>
                            <Ionicons name={focused ? 'nutrition' : 'nutrition-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused ? styles.activeIcon : undefined}>
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: Platform.select({ web: 60, ios: 88, android: 65, default: 65 }),
        paddingTop: 8,
        paddingBottom: Platform.select({ web: 8, ios: 28, default: 8 }),
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    tabLabel: {
        ...typography.caption,
        fontSize: 10,
        marginTop: 2,
    },
    activeIcon: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
});
