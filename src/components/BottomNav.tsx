import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { typography, spacing } from '../theme';
import { MotionPressable } from './ui/Motion';
import { useThemeColors } from '../hooks/useThemeColors';

const navIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: 'home',
    workouts: 'barbell',
    analytics: 'analytics',
    progress: 'trending-up',
    profile: 'person',
};

const navLabels: Record<string, string> = {
    index: 'Home',
    workouts: 'Workouts',
    analytics: 'Analytics',
    progress: 'Progress',
    profile: 'Health',
};

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors, isDark } = useThemeColors();
    const styles = makeStyles(colors, isDark);
    const visibleRoutes = state.routes.filter((route) => (descriptors[route.key]?.options as { href?: unknown } | undefined)?.href !== null);

    return (
        <View style={styles.shell} pointerEvents="box-none">
            <View style={styles.backdropWrap}>
                <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
                <LinearGradient
                    colors={isDark ? ['rgba(0,0,0,0.72)', 'rgba(10,10,10,0.92)'] : ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.98)']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>
            <View style={styles.inner}>
                {visibleRoutes.map((route) => {
                    const routeIndex = state.routes.findIndex((entry) => entry.key === route.key);
                    const isFocused = state.index === routeIndex;
                    const { options } = descriptors[route.key];
                    const label = navLabels[route.name] ?? options.title ?? route.name;
                    const iconName = navIcons[route.name] ?? 'ellipse-outline';
                    const accent = colors.primary;

                    const onPress = async () => {
                        try {
                            await Haptics.impact({ style: ImpactStyle.Light });
                        } catch {
                            // Haptics are unavailable in web preview.
                        }

                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <MotionPressable
                            key={route.key}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.item}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarButtonTestID}
                        >
                            <View style={styles.itemInner}>
                                {isFocused ? (
                                    <View style={[styles.activeDot, { backgroundColor: accent }]} />
                                ) : null}
                                <Ionicons name={iconName} size={22} color={isFocused ? accent : colors.textTertiary} />
                                <Text style={[styles.label, isFocused && { color: accent }]}>{label}</Text>
                            </View>
                        </MotionPressable>
                    );
                })}
            </View>
        </View>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors'], isDark: boolean) => StyleSheet.create({
    shell: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        paddingTop: spacing.sm,
    },
    backdropWrap: {
        ...StyleSheet.absoluteFillObject,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 999,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        backgroundColor: isDark ? 'rgba(3,7,18,0.60)' : '#fff',
        shadowColor: '#0f172a',
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: -6 },
        elevation: 18,
    },
    item: {
        flex: 1,
        alignItems: 'center',
    },
    itemInner: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: 50,
    },
    label: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 11,
        letterSpacing: 0,
    },
    activeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginBottom: 2,
        shadowColor: '#fff',
        shadowOpacity: 0.7,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
    },
});
