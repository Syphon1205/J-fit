import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card, Button } from '../../src/components/ui';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { useNutritionStore } from '../../src/stores/nutritionStore';

const exportOptions = [
    { id: 'workouts', label: 'Workout History', icon: 'barbell-outline', desc: 'All logged workouts with duration, calories, and exercises', color: colors.primary },
    { id: 'progress', label: 'Progress Data', icon: 'trending-up-outline', desc: 'Weight history, measurements, and personal records', color: colors.secondary },
    { id: 'nutrition', label: 'Nutrition Data', icon: 'nutrition-outline', desc: 'Meal logs and macro tracking history', color: colors.tertiary },
];

export default function ExportScreen() {
    const router = useRouter();
    const { workoutLogs } = useWorkoutStore();
    const { weightHistory, personalRecords } = useProgressStore();
    const [exporting, setExporting] = useState<string | null>(null);
    const [exported, setExported] = useState<string[]>([]);

    const handleExport = async (id: string) => {
        setExporting(id);
        await new Promise((r) => setTimeout(r, 1500));
        setExporting(null);
        setExported((prev) => [...prev, id]);
        Alert.alert('Export Ready', `Your ${id} data has been prepared for download. In production this would trigger a file download.`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Export Data</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.desc}>
                    Download your J-Fit data as a CSV file. Your data is always yours.
                </Text>

                <View style={styles.statsRow}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{workoutLogs.length}</Text>
                        <Text style={styles.statLabel}>Workouts</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{weightHistory.length}</Text>
                        <Text style={styles.statLabel}>Weigh-ins</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={styles.statValue}>{personalRecords.length}</Text>
                        <Text style={styles.statLabel}>PRs</Text>
                    </Card>
                </View>

                {exportOptions.map((opt) => (
                    <Card key={opt.id} style={styles.optCard}>
                        <View style={styles.optRow}>
                            <View style={[styles.optIcon, { backgroundColor: opt.color + '20' }]}>
                                <Ionicons name={opt.icon as any} size={20} color={opt.color} />
                            </View>
                            <View style={styles.optInfo}>
                                <Text style={styles.optLabel}>{opt.label}</Text>
                                <Text style={styles.optDesc}>{opt.desc}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.exportBtn, exported.includes(opt.id) && styles.exportBtnDone]}
                            onPress={() => handleExport(opt.id)}
                            disabled={exporting === opt.id}
                        >
                            <Ionicons
                                name={exported.includes(opt.id) ? 'checkmark' : exporting === opt.id ? 'hourglass-outline' : 'download-outline'}
                                size={16}
                                color={exported.includes(opt.id) ? colors.success : colors.primary}
                            />
                            <Text style={[styles.exportBtnText, exported.includes(opt.id) && { color: colors.success }]}>
                                {exported.includes(opt.id) ? 'Exported' : exporting === opt.id ? 'Preparing...' : 'Export CSV'}
                            </Text>
                        </TouchableOpacity>
                    </Card>
                ))}

                <Card style={styles.infoCard}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                    <Text style={styles.infoText}>
                        Your data is encrypted and never shared with third parties without your consent.
                    </Text>
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
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
    statValue: { ...typography.h2, color: colors.primary },
    statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    optCard: { marginBottom: spacing.md },
    optRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    optIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    optInfo: { flex: 1 },
    optLabel: { ...typography.bodyBold, color: colors.textPrimary },
    optDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
    exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary },
    exportBtnDone: { borderColor: colors.success, backgroundColor: colors.success + '10' },
    exportBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.md, backgroundColor: colors.surfaceLight },
    infoText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
});
