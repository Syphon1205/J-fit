import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useProgressStore } from '../../src/stores/progressStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useNutritionStore } from '../../src/stores/nutritionStore';
import { useAuthStore } from '../../src/stores/authStore';

const privacySettings = [
    { key: 'shareActivity', label: 'Share Activity Data', desc: 'Allow anonymous usage stats to improve the app' },
    { key: 'crashReports', label: 'Crash Reports', desc: 'Automatically send crash reports to help fix bugs' },
    { key: 'personalization', label: 'Personalized Recommendations', desc: 'Use your data to suggest workouts and meals' },
];

export default function PrivacyScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState({ shareActivity: false, crashReports: true, personalization: true });
    const progressReset = useProgressStore((s) => s.reset);
    const workoutReset = useWorkoutStore((s) => s.reset);
    const nutritionReset = useNutritionStore((s) => s.reset);
    const logout = useAuthStore((s) => s.logout);

    const handleResetProgress = () => {
        Alert.alert(
            'Reset All Progress',
            'This will permanently delete all your workout logs, weight history, meal history, and personal records. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset Everything', style: 'destructive',
                    onPress: () => {
                        progressReset();
                        workoutReset();
                        nutritionReset();
                        Alert.alert('Done', 'All progress has been reset.');
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure? This will permanently delete your account and all associated data. You will be signed out.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account', style: 'destructive',
                    onPress: () => {
                        progressReset();
                        workoutReset();
                        nutritionReset();
                        logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Privacy</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Card style={styles.infoCard}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} />
                    <Text style={styles.infoText}>Your health data is stored securely on your device and never sold to third parties.</Text>
                </Card>

                <Text style={styles.sectionLabel}>DATA SHARING</Text>
                <Card style={styles.card}>
                    {privacySettings.map((s, i) => (
                        <View key={s.key} style={[styles.row, i < privacySettings.length - 1 && styles.rowBorder]}>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{s.label}</Text>
                                <Text style={styles.rowDesc}>{s.desc}</Text>
                            </View>
                            <Switch
                                value={settings[s.key as keyof typeof settings]}
                                onValueChange={(v) => setSettings((prev) => ({ ...prev, [s.key]: v }))}
                                trackColor={{ false: colors.surfaceLight, true: colors.primary + '60' }}
                                thumbColor={settings[s.key as keyof typeof settings] ? colors.primary : colors.textTertiary}
                            />
                        </View>
                    ))}
                </Card>

                <Text style={styles.sectionLabel}>DATA MANAGEMENT</Text>
                <TouchableOpacity activeOpacity={0.8} onPress={handleResetProgress}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="refresh-outline" size={20} color={colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Reset All Progress</Text>
                            <Text style={styles.rowDesc}>Delete workout logs, weight history, and meal data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>YOUR DATA RIGHTS</Text>
                <TouchableOpacity activeOpacity={0.8}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="download-outline" size={20} color={colors.info} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Request Data Copy</Text>
                            <Text style={styles.rowDesc}>Get a full export of all your personal data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={handleDeleteAccount}>
                    <Card style={styles.actionCard}>
                        <View style={[styles.actionIcon, { backgroundColor: colors.error + '20' }]}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.rowLabel, { color: colors.error }]}>Delete Account</Text>
                            <Text style={styles.rowDesc}>Permanently delete your account and all data</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Card>
                </TouchableOpacity>

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
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.xl, backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.primary + '30' },
    infoText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
    sectionLabel: { ...typography.captionBold, color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.xl },
    card: { padding: 0 },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    actionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
    actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowInfo: { flex: 1 },
    rowLabel: { ...typography.bodyBold, color: colors.textPrimary },
    rowDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
});
