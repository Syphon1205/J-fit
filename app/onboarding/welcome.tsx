import React, { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Button } from '../../src/components/ui';
import { useAuthStore, User } from '../../src/stores/authStore';
import { useProgressStore } from '../../src/stores/progressStore';
import { GOOGLE_PRIVACY_POLICY_URL } from '../settings/privacy-policy';

const GOALS: Array<{ label: string; value: User['fitnessGoal']; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Build muscle', value: 'build_muscle', icon: 'barbell-outline' },
    { label: 'Lose weight', value: 'lose_weight', icon: 'flame-outline' },
    { label: 'Improve endurance', value: 'improve_endurance', icon: 'trail-sign-outline' },
    { label: 'Stay fit', value: 'stay_fit', icon: 'heart-outline' },
];

const FOCUS = ['Watch health sync', 'Trainer review', 'Run tracking', 'Sleep and recovery', 'Strength plan', 'Daily agenda'];

export default function WelcomeOnboardingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, completeOnboarding } = useAuthStore();
    const addWeight = useProgressStore((state) => state.addWeight);
    const [name, setName] = useState(user?.name && user.name !== 'Guest' ? user.name : '');
    const [selectedFocus, setSelectedFocus] = useState<string[]>(['Watch health sync']);
    const [fitnessGoal, setFitnessGoal] = useState<User['fitnessGoal']>(user?.fitnessGoal ?? 'build_muscle');
    const [weight, setWeight] = useState(user?.weight ? String(Math.round(user.weight * 2.20462)) : '');
    const [goalWeight, setGoalWeight] = useState(user?.goalWeight ? String(Math.round(user.goalWeight * 2.20462)) : '');
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);

    const canContinue = useMemo(
        () => name.trim().length >= 2 && selectedFocus.length > 0 && acceptedPolicy,
        [acceptedPolicy, name, selectedFocus.length]
    );

    const toggleFocus = (goal: string) => {
        setSelectedFocus((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]);
    };

    const handleContinue = () => {
        if (!canContinue) {
            Alert.alert('Review required', 'Enter your name, choose a focus, open the Privacy Policy, and accept it to continue.');
            return;
        }
        const weightLb = Number(weight);
        const goalWeightLb = Number(goalWeight);
        const weightKg = Number.isFinite(weightLb) && weightLb > 0 ? Math.round((weightLb / 2.20462) * 10) / 10 : undefined;
        const goalWeightKg = Number.isFinite(goalWeightLb) && goalWeightLb > 0 ? Math.round((goalWeightLb / 2.20462) * 10) / 10 : undefined;
        completeOnboarding({
            name: name.trim(),
            goals: selectedFocus,
            weight: weightKg,
            goalWeight: goalWeightKg,
            fitnessGoal,
        });
        if (weightKg) addWeight({ date: new Date().toISOString().split('T')[0], value: weightKg });
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, spacing.lg) }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <LinearGradient colors={[colors.primary + '28', colors.secondary + '12']} style={styles.hero}>
                    <Text style={styles.kicker}>Cunningham Fitness</Text>
                    <Text style={styles.title}>Your training hub is ready.</Text>
                    <Text style={styles.subtitle}>Set your profile, choose your focus, and confirm privacy before training data starts flowing.</Text>
                </LinearGradient>

                <Text style={styles.label}>Name</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textTertiary} style={styles.input} autoCapitalize="words" />

                <Text style={styles.label}>Primary goal</Text>
                <View style={styles.goalGrid}>
                    {GOALS.map((goal) => {
                        const active = fitnessGoal === goal.value;
                        return (
                            <TouchableOpacity key={goal.value} style={[styles.goalCard, active && styles.goalCardActive]} onPress={() => setFitnessGoal(goal.value)} activeOpacity={0.85}>
                                <Ionicons name={goal.icon} size={20} color={active ? colors.textInverse : colors.primary} />
                                <Text style={[styles.goalText, active && styles.goalTextActive]}>{goal.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.label}>What should the app help with?</Text>
                <View style={styles.focusWrap}>
                    {FOCUS.map((item) => {
                        const active = selectedFocus.includes(item);
                        return (
                            <TouchableOpacity key={item} style={[styles.focusPill, active && styles.focusPillActive]} onPress={() => toggleFocus(item)}>
                                <Text style={[styles.focusText, active && styles.focusTextActive]}>{item}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.inputGrid}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Weight (lb)</Text>
                        <TextInput value={weight} onChangeText={setWeight} placeholder="168" placeholderTextColor={colors.textTertiary} style={styles.input} keyboardType="decimal-pad" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Goal (lb)</Text>
                        <TextInput value={goalWeight} onChangeText={setGoalWeight} placeholder="Optional" placeholderTextColor={colors.textTertiary} style={styles.input} keyboardType="decimal-pad" />
                    </View>
                </View>

                <View style={styles.policyCard}>
                    <View style={styles.policyHeader}>
                        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.policyTitle}>Privacy Policy</Text>
                            <Text style={styles.policySub}>Opens in your browser for review.</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.policyButton} onPress={() => Linking.openURL(GOOGLE_PRIVACY_POLICY_URL)}>
                        <Ionicons name="open-outline" size={18} color={colors.textInverse} />
                        <Text style={styles.policyButtonText}>Open Privacy Policy</Text>
                    </TouchableOpacity>
                    <View style={styles.acceptRow}>
                        <Switch value={acceptedPolicy} onValueChange={setAcceptedPolicy} />
                        <Text style={styles.acceptText}>I have reviewed and agree to the Privacy Policy.</Text>
                    </View>
                </View>

                <Button title="Finish setup" onPress={handleContinue} size="lg" disabled={!canContinue} style={{ marginTop: spacing.md, opacity: canContinue ? 1 : 0.55 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
    hero: { borderRadius: 28, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
    kicker: { ...typography.captionBold, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
    title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.sm },
    label: { ...typography.captionBold, color: colors.textTertiary, marginTop: spacing.sm },
    input: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, ...typography.body },
    goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    goalCard: { width: '48%', minHeight: 82, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, justifyContent: 'space-between' },
    goalCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    goalText: { ...typography.bodyBold, color: colors.textPrimary },
    goalTextActive: { color: colors.textInverse },
    focusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    focusPill: { borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    focusPillActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '50' },
    focusText: { ...typography.captionBold, color: colors.textSecondary },
    focusTextActive: { color: colors.primary },
    inputGrid: { flexDirection: 'row', gap: spacing.md },
    policyCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
    policyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    policyTitle: { ...typography.h3, color: colors.textPrimary },
    policySub: { ...typography.caption, color: colors.textSecondary },
    policyButton: { minHeight: 50, borderRadius: 999, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    policyButtonText: { ...typography.bodyBold, color: colors.textInverse },
    policyScroll: { maxHeight: 260, borderRadius: 16, backgroundColor: colors.background, padding: spacing.md },
    policyBlock: { marginBottom: spacing.md },
    policyBlockTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 4 },
    policyText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
    acceptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    acceptText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
});
