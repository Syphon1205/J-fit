import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';
import { ExerciseProfile, getAlternateExercise, getExerciseById } from '../utils/exerciseLogic';

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.max(0, seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

function ExerciseCard({ exercise, colors }: { exercise: ExerciseProfile; colors: ReturnType<typeof useThemeColors>['colors'] }) {
    const styles = makeStyles(colors);
    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Current exercise</Text>
                    <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                </View>
                <View style={styles.roundIcon}><Ionicons name="barbell-outline" size={24} color={colors.secondary} /></View>
            </View>
            <Text style={styles.copy}>{exercise.coachingCue}</Text>
            <View style={styles.chips}>
                <Text style={styles.chip}>{exercise.prescription}</Text>
                <Text style={styles.chip}>{exercise.equipment}</Text>
                <Text style={styles.chip}>{exercise.muscleGroup}</Text>
            </View>
        </View>
    );
}

export default function ActiveWorkout() {
    const router = useRouter();
    const { colors } = useThemeColors();
    const styles = makeStyles(colors);
    const [exercise, setExercise] = useState(() => getExerciseById('barbell-bench-press'));
    const [restSeconds, setRestSeconds] = useState(98);
    const alternate = useMemo(() => getAlternateExercise(exercise.id), [exercise.id]);

    useEffect(() => {
        const interval = setInterval(() => setRestSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => clearInterval(interval);
    }, []);

    const completeSet = () => {
        Alert.alert('Set logged', 'Rest timer restarted for your next working set.');
        setRestSeconds(105);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/workouts' as never)}>
                        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Active workout</Text>
                        <Text style={styles.title}>Strength Block</Text>
                    </View>
                </View>

                <View style={styles.timerCard}>
                    <View style={styles.roundIcon}><Ionicons name="timer-outline" size={24} color={colors.primary} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Rest timer</Text>
                        <Text style={styles.timer}>{formatTime(restSeconds)}</Text>
                        <Text style={styles.copy}>Recover, reset your setup, and keep the next set clean.</Text>
                    </View>
                    <TouchableOpacity style={styles.smallButton} onPress={() => setRestSeconds(105)}>
                        <Ionicons name="refresh-outline" size={17} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <ExerciseCard exercise={exercise} colors={colors} />

                <View style={styles.card}>
                    <Text style={styles.swapTitle}>Bench is taken?</Text>
                    <Text style={styles.copy}>Swap to {alternate.name} and preserve the same muscle stimulus with different equipment.</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => { setExercise(alternate); setRestSeconds(105); }}>
                        <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
                        <Text style={styles.secondaryButtonText}>Swap Exercise</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                    {[
                        ['Set plan', '4 working sets'],
                        ['Target', 'Chest + triceps'],
                        ['Intensity', 'Moderate-heavy'],
                    ].map(([label, value]) => (
                        <View key={label} style={styles.metric}>
                            <Text style={styles.label}>{label}</Text>
                            <Text style={styles.metricValue}>{value}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={completeSet}>
                    <Ionicons name="checkmark-circle-outline" size={21} color="#fff" />
                    <Text style={styles.primaryButtonText}>Complete Set</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 18, paddingBottom: 112, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 12 },
    backButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    label: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    title: { color: colors.textPrimary, fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -1 },
    card: { backgroundColor: colors.surface, borderRadius: 30, borderWidth: 1, borderColor: colors.border, padding: 18 },
    timerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 30, borderWidth: 1, borderColor: colors.border, padding: 16 },
    roundIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    timer: { color: colors.textPrimary, fontSize: 40, fontWeight: '900', letterSpacing: -1, marginVertical: 4 },
    copy: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, fontWeight: '600', marginTop: 8 },
    smallButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    exerciseTitle: { color: colors.textPrimary, fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -0.8, marginTop: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    chip: { overflow: 'hidden', borderRadius: 999, backgroundColor: colors.surfaceLight, color: colors.textSecondary, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontWeight: '800' },
    swapTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, minHeight: 52, borderRadius: 999, backgroundColor: colors.primaryGlow },
    secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
    grid: { flexDirection: 'row', gap: 10 },
    metric: { flex: 1, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 14 },
    metricValue: { color: colors.textPrimary, fontSize: 16, lineHeight: 20, fontWeight: '900', marginTop: 8 },
    primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 58, borderRadius: 999, backgroundColor: colors.primary },
    primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
