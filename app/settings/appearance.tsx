import React, { useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/ui';
import { ThemePreset, useThemeStore } from '../../src/stores/themeStore';
import { safeBack } from '../../src/utils/navigation';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const themes = [
    { id: 'dark', label: 'Dark', desc: 'Deep charcoal with electric teal accents', icon: 'moon' },
    { id: 'light', label: 'Light', desc: 'Clean white with teal accents', icon: 'sunny' },
    { id: 'auto', label: 'Auto', desc: 'Follows your device system setting', icon: 'contrast' },
];

const units = [
    { id: 'metric', label: 'Metric', desc: 'kg, km, cm' },
    { id: 'imperial', label: 'Imperial', desc: 'lbs, miles, ft' },
];

const presetThemes: { id: ThemePreset; label: string; desc: string; swatch: string[]; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'classic', label: 'Classic Neon', desc: 'Original J-Fit electric look', swatch: ['#00E5C7', '#A78BFA'], icon: 'sparkles' },
    { id: 'punchy', label: 'Punchy', desc: 'Orange, sky blue, and confident pink accents', swatch: ['#F97316', '#0EA5E9'], icon: 'flash' },
    { id: 'earthy', label: 'Earthy', desc: 'Natural greens and warm sand accents', swatch: ['#6FA84F', '#C2A878'], icon: 'leaf' },
];

export default function AppearanceScreen() {
    const router = useRouter();
    const { mode, units: selectedUnits, preset, setMode, setUnits, setPreset } = useThemeStore();
    const theme = useThemeColors();
    const themed = makeStyles(theme.colors);

    return (
        <SafeAreaView style={[themed.container, { backgroundColor: theme.colors.background }]}>
            <View style={themed.topBar}>
                <TouchableOpacity onPress={() => safeBack(router, '/profile')} style={themed.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={themed.title}>Appearance</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={themed.content}>
                {/* Live preview pill */}
                <View style={themed.previewRow}>
                    <View style={themed.previewDark}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Dark</Text>
                    </View>
                    <View style={themed.previewLight}>
                        <Text style={{ color: '#0D0D1A', fontSize: 11, fontWeight: '700' }}>Light</Text>
                    </View>
                    <Text style={themed.previewLabel}>Current: {mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
                </View>

                <Text style={themed.sectionLabel}>Theme</Text>
                <Card style={themed.card}>
                    {themes.map((t, i) => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => {
                                if (mode === t.id) return;
                                setMode(t.id as any);
                            }}
                            style={[themed.row, i < themes.length - 1 && themed.rowBorder]}
                        >
                            <View style={[themed.iconWrap, mode === t.id && { backgroundColor: theme.colors.primaryGlow }]}>
                                <Ionicons name={t.icon as any} size={18} color={mode === t.id ? theme.colors.primary : theme.colors.textSecondary} />
                            </View>
                            <View style={themed.rowInfo}>
                                <Text style={themed.rowLabel}>{t.label}</Text>
                                <Text style={themed.rowDesc}>{t.desc}</Text>
                            </View>
                            {mode === t.id && (
                                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </Card>

                <Text style={themed.sectionLabel}>Units</Text>
                <Card style={themed.card}>
                    {units.map((u, i) => (
                        <TouchableOpacity
                            key={u.id}
                            onPress={() => setUnits(u.id as any)}
                            style={[themed.row, i < units.length - 1 && themed.rowBorder]}
                        >
                            <View style={themed.rowInfo}>
                                <Text style={themed.rowLabel}>{u.label}</Text>
                                <Text style={themed.rowDesc}>{u.desc}</Text>
                            </View>
                            {selectedUnits === u.id && (
                                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </Card>

                <Text style={themed.sectionLabel}>Style Theme</Text>
                <Card style={themed.card}>
                    {presetThemes.map((t, i) => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => {
                                if (preset === t.id) return;
                                setPreset(t.id);
                            }}
                            style={[themed.row, i < presetThemes.length - 1 && themed.rowBorder]}
                        >
                            <View style={[themed.iconWrap, preset === t.id && { backgroundColor: theme.colors.primaryGlow }]}>
                                <Ionicons name={t.icon} size={17} color={preset === t.id ? theme.colors.primary : theme.colors.textSecondary} />
                            </View>
                            <View style={themed.rowInfo}>
                                <Text style={themed.rowLabel}>{t.label}</Text>
                                <Text style={themed.rowDesc}>{t.desc}</Text>
                            </View>
                            <View style={themed.swatchRow}>
                                <View style={[themed.swatchDot, { backgroundColor: t.swatch[0] }]} />
                                <View style={[themed.swatchDot, { backgroundColor: t.swatch[1] }]} />
                            </View>
                            {preset === t.id && (
                                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} style={{ marginLeft: 8 }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </Card>
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
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
    swatchRow: { flexDirection: 'row', gap: 6, marginRight: 2 },
    swatchDot: { width: 11, height: 11, borderRadius: 5.5 },
});
