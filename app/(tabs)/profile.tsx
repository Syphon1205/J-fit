import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useNotificationsStore } from '../../src/stores/notificationsStore';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { workoutLogs } = useWorkoutStore();
    const { unreadCount } = useNotificationsStore();

    const totalWorkouts = workoutLogs.length;
    const totalCalories = workoutLogs.reduce((sum, l) => sum + l.caloriesBurned, 0);
    const currentStreak = 6;

    const settingsItems = [
        { icon: 'watch-outline', label: 'Connected Devices', route: '/settings/connections', color: colors.primary, badge: null },
        { icon: 'notifications-outline', label: 'Notifications', route: '/settings/notifications', color: colors.warning, badge: unreadCount > 0 ? unreadCount : null },
        { icon: 'moon-outline', label: 'Appearance', route: '/settings/appearance', color: colors.secondary, badge: null },
        { icon: 'download-outline', label: 'Export Data', route: '/settings/export', color: colors.info, badge: null },
        { icon: 'shield-checkmark-outline', label: 'Privacy', route: '/settings/privacy', color: colors.success, badge: null },
        { icon: 'help-circle-outline', label: 'Help & Support', route: '/settings/help', color: colors.textSecondary, badge: null },
    ];

    const achievements = [
        { emoji: '🔥', label: '7-Day Streak', unlocked: true },
        { emoji: '💪', label: '50 Workouts', unlocked: true },
        { emoji: '🏋️', label: '100kg Bench', unlocked: true },
        { emoji: '🏃', label: '5K Under 25m', unlocked: true },
        { emoji: '🎯', label: 'Goal Weight', unlocked: false },
        { emoji: '🌟', label: '100 Workouts', unlocked: false },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>
                            {(user?.name || 'Alex').charAt(0).toUpperCase()}
                        </Text>
                    </LinearGradient>
                    <Text style={styles.name}>{user?.name || 'Alex Johnson'}</Text>
                    <Text style={styles.email}>{user?.email || 'alex@jfit.com'}</Text>
                    <Text style={styles.memberSince}>Member since Sept 2025</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{totalWorkouts}</Text>
                        <Text style={styles.statLabel}>Workouts</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{(totalCalories / 1000).toFixed(1)}k</Text>
                        <Text style={styles.statLabel}>Calories</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{currentStreak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                    </Card>
                </View>

                {/* Achievements */}
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.achieveGrid}>
                    {achievements.map((a, i) => (
                        <View
                            key={i}
                            style={[styles.achieveCard, !a.unlocked && styles.achieveLocked]}
                        >
                            <Text style={styles.achieveEmoji}>{a.emoji}</Text>
                            <Text style={[styles.achieveLabel, !a.unlocked && { color: colors.textTertiary }]}>{a.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Settings */}
                <Text style={styles.sectionTitle}>Settings</Text>
                <Card style={styles.settingsCard}>
                    {settingsItems.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.settingRow, i < settingsItems.length - 1 && styles.settingBorder]}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: item.color + '18' }]}>
                                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                                </View>
                                <Text style={styles.settingLabel}>{item.label}</Text>
                                {item.badge && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{item.badge}</Text>
                                    </View>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </Card>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); router.replace('/(auth)/login'); }}>
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>J-Fit v1.0.0</Text>
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    avatarText: { ...typography.display, color: colors.textInverse },
    name: { ...typography.h1, color: colors.textPrimary },
    email: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs },
    memberSince: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
    statValue: { ...typography.h2, color: colors.primary },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl },
    achieveCard: {
        width: '31%' as any,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    achieveLocked: { opacity: 0.4 },
    achieveEmoji: { fontSize: 28 },
    achieveLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
    settingsCard: { marginBottom: spacing.xxl, padding: 0 },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
    },
    settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    settingIcon: {
        width: 34,
        height: 34,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: { ...typography.body, color: colors.textPrimary },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        backgroundColor: colors.error + '12',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    logoutText: { ...typography.body, color: colors.error, fontWeight: '600' },
    version: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginBottom: spacing.lg },
    badge: {
        backgroundColor: colors.warning,
        borderRadius: borderRadius.full,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        marginLeft: spacing.xs,
    },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#000' },
});
