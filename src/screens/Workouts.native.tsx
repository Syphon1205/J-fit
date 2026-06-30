import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';
import { useRepLogStore } from '../stores/repLogStore';
import { useRunStore } from '../stores/runStore';
import { useWorkoutStore } from '../stores/workoutStore';

const todayKey = () => new Date().toISOString().slice(0, 10);
const shiftDate = (date: string, days: number) => {
    const next = new Date(`${date}T12:00:00`);
    next.setDate(next.getDate() + days);
    return next.toISOString().slice(0, 10);
};
const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));

export default function Workouts() {
    const router = useRouter();
    const { colors, gradients } = useThemeColors();
    const styles = makeStyles(colors);
    const workouts = useWorkoutStore((state) => state.workouts);
    const runSessions = useRunStore((state) => state.sessions);
    const repEntries = useRepLogStore((state) => state.repEntries);
    const addRepEntry = useRepLogStore((state) => state.addRepEntry);
    const removeRepEntry = useRepLogStore((state) => state.removeRepEntry);
    const [selectedDate, setSelectedDate] = useState(todayKey());
    const [exercise, setExercise] = useState('Bench Press');
    const [sets, setSets] = useState('3');
    const [reps, setReps] = useState('10');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');

    const dayEntries = useMemo(
        () => repEntries.filter((entry) => entry.date === selectedDate).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        [repEntries, selectedDate],
    );
    const dailyTotals = useMemo(() => ({
        sets: dayEntries.reduce((sum, entry) => sum + entry.sets, 0),
        reps: dayEntries.reduce((sum, entry) => sum + entry.sets * entry.reps, 0),
        volume: Math.round(dayEntries.reduce((sum, entry) => sum + (entry.weightKg ?? 0) * entry.sets * entry.reps, 0)),
    }), [dayEntries]);

    const submitRepEntry = () => {
        const parsedSets = Number(sets);
        const parsedReps = Number(reps);
        const parsedWeight = weight.trim() ? Number(weight) : undefined;
        if (!exercise.trim() || !Number.isFinite(parsedSets) || !Number.isFinite(parsedReps) || parsedSets <= 0 || parsedReps <= 0) {
            Alert.alert('Check the log', 'Add an exercise with valid sets and reps.');
            return;
        }
        addRepEntry({
            date: selectedDate,
            exercise,
            sets: parsedSets,
            reps: parsedReps,
            weightKg: parsedWeight && Number.isFinite(parsedWeight) ? parsedWeight : undefined,
            notes,
        });
        setNotes('');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.kicker}>Training</Text>
                        <Text style={styles.title}>Workouts</Text>
                        <Text style={styles.copy}>Training blocks, runs, and rep history in one place.</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.86} style={styles.startButton} onPress={() => router.push('/active-workout' as never)}>
                        <Ionicons name="play" size={18} color={colors.textInverse} />
                        <Text style={styles.startButtonText}>Start</Text>
                    </TouchableOpacity>
                </View>

                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                    <View style={styles.heroIcon}>
                        <Ionicons name="barbell-outline" size={26} color={colors.textInverse} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroTitle}>Rep logger</Text>
                        <Text style={styles.heroCopy}>Save sets by date and review what actually got done.</Text>
                    </View>
                </LinearGradient>

                <View style={styles.metricGrid}>
                    {[
                        ['Programs', `${workouts.length}`, 'barbell-outline'],
                        ['Runs', `${runSessions.length}`, 'map-outline'],
                        ['Today reps', `${dailyTotals.reps}`, 'repeat-outline'],
                    ].map(([label, value, icon]) => (
                        <View key={label} style={styles.metricCard}>
                            <Ionicons name={icon as any} size={21} color={colors.primary} />
                            <Text style={styles.metricLabel}>{label}</Text>
                            <Text style={styles.metricValue}>{value}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.card}>
                    <View style={styles.repHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Track reps</Text>
                            <Text style={styles.copy}>Browse days and log the set block.</Text>
                        </View>
                        <View style={styles.dateControls}>
                            <TouchableOpacity style={styles.iconButton} onPress={() => setSelectedDate((date) => shiftDate(date, -1))}>
                                <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.datePill}>{formatDate(selectedDate)}</Text>
                            <TouchableOpacity style={styles.iconButton} onPress={() => setSelectedDate((date) => shiftDate(date, 1))}>
                                <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.fieldLabel}>Exercise</Text>
                    <TextInput value={exercise} onChangeText={setExercise} placeholder="Exercise name" placeholderTextColor={colors.textTertiary} style={styles.input} />
                    <View style={styles.inputRow}>
                        <View style={styles.inputColumn}>
                            <Text style={styles.fieldLabel}>Sets</Text>
                            <TextInput value={sets} onChangeText={setSets} keyboardType="number-pad" style={styles.input} />
                        </View>
                        <View style={styles.inputColumn}>
                            <Text style={styles.fieldLabel}>Reps</Text>
                            <TextInput value={reps} onChangeText={setReps} keyboardType="number-pad" style={styles.input} />
                        </View>
                        <View style={styles.inputColumn}>
                            <Text style={styles.fieldLabel}>Kg</Text>
                            <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="Opt" placeholderTextColor={colors.textTertiary} style={styles.input} />
                        </View>
                    </View>
                    <Text style={styles.fieldLabel}>Notes</Text>
                    <TextInput value={notes} onChangeText={setNotes} placeholder="Tempo, form, soreness..." placeholderTextColor={colors.textTertiary} style={styles.input} />
                    <TouchableOpacity activeOpacity={0.88} style={styles.logButton} onPress={submitRepEntry}>
                        <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
                        <Text style={styles.logButtonText}>Log reps</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <View style={styles.totalGrid}>
                        <View style={styles.totalTile}><Text style={styles.totalValue}>{dailyTotals.sets}</Text><Text style={styles.totalLabel}>Sets</Text></View>
                        <View style={styles.totalTile}><Text style={styles.totalValue}>{dailyTotals.reps}</Text><Text style={styles.totalLabel}>Reps</Text></View>
                        <View style={styles.totalTile}><Text style={styles.totalValue}>{dailyTotals.volume}</Text><Text style={styles.totalLabel}>Volume kg</Text></View>
                    </View>
                    <View style={styles.historyList}>
                        {dayEntries.length > 0 ? dayEntries.map((entry) => (
                            <View key={entry.id} style={styles.repEntry}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.repName}>{entry.exercise}</Text>
                                    <Text style={styles.repMeta}>
                                        {entry.sets} x {entry.reps}{entry.weightKg ? ` · ${entry.weightKg} kg` : ''}{entry.notes ? ` · ${entry.notes}` : ''}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeRepEntry(entry.id)}>
                                    <Ionicons name="trash-outline" size={17} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="barbell-outline" size={25} color={colors.textSecondary} />
                                <Text style={styles.emptyTitle}>No reps logged</Text>
                                <Text style={styles.emptyCopy}>Add a movement to start this day.</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Programs</Text>
                {workouts.slice(0, 6).map((workout) => (
                    <TouchableOpacity key={workout.id} activeOpacity={0.84} style={styles.workoutCard} onPress={() => router.push(`/workout/${workout.id}` as never)}>
                        <View style={[styles.programIcon, { backgroundColor: `${workout.color}22` }]}>
                            <Ionicons name={(workout.icon || 'barbell') as any} size={22} color={workout.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.workoutTitle}>{workout.name}</Text>
                            <Text style={styles.workoutCopy}>{workout.exercises.length} movements · {workout.duration} min</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const makeStyles = (colors: ReturnType<typeof useThemeColors>['colors']) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 18, paddingBottom: 112, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingTop: 12 },
    kicker: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
    title: { color: colors.textPrimary, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1 },
    copy: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, fontWeight: '600', marginTop: 5 },
    startButton: { minHeight: 46, borderRadius: 23, backgroundColor: colors.primary, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
    startButtonText: { color: colors.textInverse, fontSize: 15, fontWeight: '900' },
    hero: { borderRadius: 30, padding: 18, minHeight: 116, flexDirection: 'row', alignItems: 'center', gap: 14 },
    heroIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
    heroTitle: { color: colors.textInverse, fontSize: 25, fontWeight: '900', letterSpacing: -0.4 },
    heroCopy: { color: colors.textInverse, opacity: 0.82, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 4 },
    metricGrid: { flexDirection: 'row', gap: 10 },
    metricCard: { flex: 1, minHeight: 104, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 13 },
    metricLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginTop: 13 },
    metricValue: { color: colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 4 },
    card: { backgroundColor: colors.surface, borderRadius: 30, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
    repHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    sectionTitle: { color: colors.textPrimary, fontSize: 23, fontWeight: '900', letterSpacing: -0.5 },
    dateControls: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 0 },
    iconButton: { width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight },
    datePill: { overflow: 'hidden', borderRadius: 999, backgroundColor: colors.primaryGlow, color: colors.primary, paddingHorizontal: 11, paddingVertical: 10, fontSize: 12, fontWeight: '900' },
    fieldLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '900', marginTop: 2 },
    input: { minHeight: 48, borderRadius: 17, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, paddingHorizontal: 13, fontSize: 15, fontWeight: '800' },
    inputRow: { flexDirection: 'row', gap: 9 },
    inputColumn: { flex: 1, gap: 7 },
    logButton: { minHeight: 52, borderRadius: 26, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
    logButtonText: { color: colors.textInverse, fontSize: 16, fontWeight: '900' },
    totalGrid: { flexDirection: 'row', gap: 9 },
    totalTile: { flex: 1, borderRadius: 20, backgroundColor: colors.surfaceLight, padding: 13 },
    totalValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '900' },
    totalLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginTop: 4 },
    historyList: { gap: 9 },
    repEntry: { borderRadius: 20, backgroundColor: colors.surfaceLight, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
    repName: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
    repMeta: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 4 },
    deleteButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    emptyState: { minHeight: 132, borderRadius: 22, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
    emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
    emptyCopy: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
    workoutCard: { borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    programIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    workoutTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
    workoutCopy: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginTop: 4 },
});
