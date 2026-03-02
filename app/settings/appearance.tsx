import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { useThemeStore } from '../../src/stores/themeStore';

const themes = [
    { id: 'dark', label: 'Dark', desc: 'Deep charcoal with electric teal accents', icon: 'moon' },
    { id: 'light', label: 'Light', desc: 'Clean white with teal accents', icon: 'sunny' },
    { id: 'auto', label: 'Auto', desc: 'Follows your device system setting', icon: 'contrast' },
];

const units = [
    { id: 'metric', label: 'Metric', desc: 'kg, km, cm' },
    { id: 'imperial', label: 'Imperial', desc: 'lbs, miles, ft' },
];

export default function AppearanceScreen() {
    const router = useRouter();
    const { mode, units: selectedUnits, setMode, setUnits } = useThemeStore();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Appearance</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Live preview pill */}
                <View style={styles.previewRow}>
                    <View style={styles.previewDark}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Dark</Text>
                    </View>
                    <View style={styles.previewLight}>
                        <Text style={{ color: '#0D0D1A', fontSize: 11, fontWeight: '700' }}>Light</Text>
                    </View>
                    <Text style={styles.previewLabel}>Current: {mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
                </View>

                <Text style={styles.sectionLabel}>THEME</Text>
                <Card style={styles.card}>
                    {themes.map((t, i) => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => setMode(t.id as any)}
                            style={[styles.row, i < themes.length - 1 && styles.rowBorder]}
                        >
                            <View style={[styles.iconWrap, mode === t.id && { backgroundColor: colors.primaryGlow }]}>
                                <Ionicons name={t.icon as any} size={18} color={mode === t.id ? colors.primary : colors.textSecondary} />
                            </View>
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{t.label}</Text>
                                <Text style={styles.rowDesc}>{t.desc}</Text>
                            </View>
                            {mode === t.id && (
                                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </Card>

                <Text style={styles.sectionLabel}>UNITS</Text>
                <Card style={styles.card}>
                    {units.map((u, i) => (
                        <TouchableOpacity
                            key={u.id}
                            onPress={() => setUnits(u.id as any)}
                            style={[styles.row, i < units.length - 1 && styles.rowBorder]}
                        >
                            <View style={styles.rowInfo}>
                                <Text style={styles.rowLabel}>{u.label}</Text>
                                <Text style={styles.rowDesc}>{u.desc}</Text>
                            </View>
                            {selectedUnits === u.id && (
                                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </Card>
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h3, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg },
    previewDark: { backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    previewLight: { backgroundColor: '#F5F5F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    previewLabel: { ...typography.caption, color: colors.textSecondary },
    sectionLabel: { ...typography.captionBold, color: colors.textTertiary, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.xl },
    card: { padding: 0 },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    iconWrap: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight },
    rowInfo: { flex: 1 },
    rowLabel: { ...typography.bodyBold, color: colors.textPrimary },
    rowDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
