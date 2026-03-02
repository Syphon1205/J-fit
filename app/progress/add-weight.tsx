import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { useProgressStore } from '../../src/stores/progressStore';

export default function AddWeightScreen() {
    const router = useRouter();
    const { addWeight } = useProgressStore();
    const [weight, setWeight] = useState('');
    const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const val = parseFloat(weight);
        if (!weight || isNaN(val) || val <= 0) {
            Alert.alert('Invalid Weight', 'Please enter a valid weight.');
            return;
        }
        setSaving(true);
        const kgValue = unit === 'lbs' ? val * 0.453592 : val;
        const today = new Date().toISOString().split('T')[0];
        addWeight({ date: today, value: kgValue });
        await new Promise((r) => setTimeout(r, 500));
        setSaving(false);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <Ionicons name="close" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Log Weight</Text>
                    <View style={{ width: 36 }} />
                </View>

                <View style={styles.content}>
                    {/* Unit toggle */}
                    <View style={styles.unitToggle}>
                        {(['kg', 'lbs'] as const).map((u) => (
                            <TouchableOpacity
                                key={u}
                                onPress={() => setUnit(u)}
                                style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                            >
                                <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Weight input */}
                    <View style={styles.bigInputWrap}>
                        <TextInput
                            style={styles.bigInput}
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="0.0"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="decimal-pad"
                            autoFocus
                            maxLength={6}
                        />
                        <Text style={styles.bigUnit}>{unit}</Text>
                    </View>

                    {/* Date */}
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
                        <Text style={styles.dateText}>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>

                    {/* Note */}
                    <View style={styles.noteWrap}>
                        <Text style={styles.noteLabel}>Note (optional)</Text>
                        <TextInput
                            style={styles.noteInput}
                            value={note}
                            onChangeText={setNote}
                            placeholder="e.g. Morning, post-workout..."
                            placeholderTextColor={colors.textTertiary}
                            maxLength={80}
                        />
                    </View>

                    <Button
                        title="Save Weight"
                        onPress={handleSave}
                        loading={saving}
                        size="lg"
                        style={{ marginTop: spacing.xl }}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h3, color: colors.textPrimary },
    content: { flex: 1, paddingHorizontal: spacing.xxl },
    unitToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.full, padding: 4, alignSelf: 'center', marginBottom: spacing.xxl, marginTop: spacing.xl },
    unitBtn: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
    unitBtnActive: { backgroundColor: colors.primary },
    unitText: { ...typography.bodyBold, color: colors.textSecondary },
    unitTextActive: { color: colors.textInverse },
    bigInputWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    bigInput: { fontSize: 72, fontWeight: '700', color: colors.textPrimary, minWidth: 120, textAlign: 'center' },
    bigUnit: { ...typography.h2, color: colors.textSecondary, marginBottom: spacing.md },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.xl },
    dateText: { ...typography.subhead, color: colors.textSecondary },
    noteLabel: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
    noteWrap: { marginTop: spacing.md },
    noteInput: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, ...typography.body },
});
