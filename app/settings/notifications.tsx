import React from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useNotificationsStore } from '../../src/stores/notificationsStore';
import { safeBack } from '../../src/utils/navigation';

const settingRows = [
    { key: 'workoutReminders', label: 'Workout Reminders', desc: 'Daily reminders at your scheduled workout time', icon: 'barbell-outline', color: colors.primary },
    { key: 'achievements', label: 'Achievements', desc: 'Celebrate PRs and milestones', icon: 'trophy-outline', color: colors.warning },
    { key: 'syncAlerts', label: 'Sync Alerts', desc: 'Get notified when wearable data syncs', icon: 'sync-outline', color: colors.info },
    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Monday summary of last week\'s activity', icon: 'stats-chart-outline', color: colors.success },
];

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const { settings, updateSetting } = useNotificationsStore();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/profile')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.desc}>Choose which notifications you want to receive.</Text>
                <Card style={styles.card}>
                    {settingRows.map((row, i) => (
                        <View key={row.key} style={[styles.row, i < settingRows.length - 1 && styles.rowBorder]}>
                            <View style={[styles.rowIcon, { backgroundColor: row.color + '18' }]}>
                                <Ionicons name={row.icon as any} size={18} color={row.color} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{row.label}</Text>
                                <Text style={styles.rowDesc}>{row.desc}</Text>
                            </View>
                            <Switch
                                value={Boolean(settings[row.key as keyof typeof settings])}
                                onValueChange={(v) => updateSetting(row.key, v)}
                                trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
                                thumbColor={settings[row.key as keyof typeof settings] ? colors.primary : colors.textTertiary}
                            />
                        </View>
                    ))}
                </Card>
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h3, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    desc: { ...typography.subhead, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 22 },
    card: { padding: 0 },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
    rowInfo: { flex: 1 },
    rowLabel: { ...typography.bodyBold, color: colors.textPrimary },
    rowDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
});
