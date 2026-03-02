import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { useNutritionStore } from '../../src/stores/nutritionStore';

const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function LogMealScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ meal?: string }>();
    const { logMealItem } = useNutritionStore();
    const [mealType, setMealType] = useState(params.meal || 'Breakfast');
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!foodName.trim() || !calories) {
            Alert.alert('Missing Info', 'Please enter at least a food name and calories.');
            return;
        }
        setSaving(true);
        logMealItem({
            name: foodName.trim(),
            mealType,
            calories: parseInt(calories) || 0,
            protein: parseInt(protein) || 0,
            carbs: parseInt(carbs) || 0,
            fat: parseInt(fat) || 0,
        });
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
                    <Text style={styles.title}>Log Meal</Text>
                    <View style={{ width: 36 }} />
                </View>
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        {/* Meal type selector */}
                        <Text style={styles.label}>Meal Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xl }}>
                            <View style={styles.mealRow}>
                                {mealTypes.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setMealType(m)}
                                        style={[styles.mealBtn, mealType === m && styles.mealBtnActive]}
                                    >
                                        <Text style={[styles.mealText, mealType === m && styles.mealTextActive]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Food name */}
                        <Text style={styles.label}>Food Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={foodName}
                            onChangeText={setFoodName}
                            placeholder="e.g. Grilled Chicken Breast"
                            placeholderTextColor={colors.textTertiary}
                            autoFocus
                        />

                        {/* Calories */}
                        <Text style={styles.label}>Calories *</Text>
                        <TextInput
                            style={styles.input}
                            value={calories}
                            onChangeText={setCalories}
                            placeholder="e.g. 320"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="number-pad"
                        />

                        {/* Macros */}
                        <Text style={styles.label}>Macros (g) — optional</Text>
                        <View style={styles.macroRow}>
                            {[
                                { label: 'Protein', value: protein, set: setProtein, color: '#FF6B9D' },
                                { label: 'Carbs', value: carbs, set: setCarbs, color: colors.secondary },
                                { label: 'Fat', value: fat, set: setFat, color: colors.warning },
                            ].map((m) => (
                                <View key={m.label} style={styles.macroItem}>
                                    <Text style={[styles.macroLabel, { color: m.color }]}>{m.label}</Text>
                                    <TextInput
                                        style={[styles.macroInput, { borderColor: m.color + '40' }]}
                                        value={m.value}
                                        onChangeText={m.set}
                                        placeholder="0"
                                        placeholderTextColor={colors.textTertiary}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            ))}
                        </View>

                        <Button
                            title="Save Meal"
                            onPress={handleSave}
                            loading={saving}
                            size="lg"
                            style={{ marginTop: spacing.xl }}
                        />
                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    title: { ...typography.h3, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.xl },
    label: { ...typography.captionBold, color: colors.textTertiary, letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.lg },
    input: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, ...typography.body, marginBottom: spacing.xs },
    mealRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
    mealBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    mealBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    mealText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    mealTextActive: { color: colors.textInverse },
    macroRow: { flexDirection: 'row', gap: spacing.md },
    macroItem: { flex: 1 },
    macroLabel: { ...typography.caption, fontWeight: '700', marginBottom: spacing.xs },
    macroInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.textPrimary, borderWidth: 1, textAlign: 'center', ...typography.body },
});
