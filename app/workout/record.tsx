import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Button, Card, Input } from '../../src/components/ui';
import { borderRadius, colors, spacing, typography } from '../../src/theme';
import {
    useWorkoutVideoStore,
    WorkoutVideoAssessment,
    WorkoutVideoExercise,
    WorkoutVideoMetric,
} from '../../src/stores/workoutVideoStore';
import { safeBack } from '../../src/utils/navigation';

type ExerciseOption = {
    id: WorkoutVideoExercise;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    tips: string[];
};

const exerciseOptions: ExerciseOption[] = [
    {
        id: 'pushups',
        label: 'Push-ups',
        icon: 'fitness-outline',
        tips: ['Keep a straight line from shoulders to heels', 'Lower chest fully, then press up', 'Keep elbows around 45°'],
    },
    {
        id: 'squats',
        label: 'Squats',
        icon: 'body-outline',
        tips: ['Brace core before descent', 'Knees track over toes', 'Reach parallel depth or lower'],
    },
    {
        id: 'lunges',
        label: 'Lunges',
        icon: 'walk-outline',
        tips: ['Step long enough for 90° knee angles', 'Keep torso upright', 'Control the return phase'],
    },
    {
        id: 'plank',
        label: 'Plank',
        icon: 'remove-outline',
        tips: ['Stack shoulders over elbows', 'Brace abs and glutes', 'Avoid sagging hips'],
    },
    {
        id: 'burpees',
        label: 'Burpees',
        icon: 'flash-outline',
        tips: ['Land softly each rep', 'Keep pace steady', 'Use full lockout at top'],
    },
];

const exerciseBias: Record<WorkoutVideoExercise, number> = {
    pushups: 8,
    squats: 6,
    lunges: 4,
    plank: 5,
    burpees: 3,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getExerciseParam = (value: string | string[] | undefined): WorkoutVideoExercise => {
    const raw = Array.isArray(value) ? value[0] : value;
    const normalized = `${raw || ''}`.toLowerCase();
    const found = exerciseOptions.find((item) => item.id === normalized);
    return found ? found.id : 'pushups';
};

const getMetrics = (
    exercise: WorkoutVideoExercise,
    durationSec: number,
    reps: number,
): WorkoutVideoMetric[] => {
    const rangeScore = clamp(Math.round(46 + reps * 2.1), 40, 100);
    const tempoScore = clamp(Math.round(35 + durationSec * 1.2), 40, 100);
    const expectedRatio = exercise === 'plank' ? 0.15 : 0.65;
    const actualRatio = reps > 0 ? reps / Math.max(durationSec, 1) : 0;
    const ratioPenalty = Math.min(28, Math.abs(actualRatio - expectedRatio) * 44);
    const stabilityScore = clamp(Math.round(90 - ratioPenalty), 45, 100);

    return [
        { key: 'range', label: 'Range of motion', score: rangeScore },
        { key: 'tempo', label: 'Tempo control', score: tempoScore },
        { key: 'stability', label: 'Body stability', score: stabilityScore },
    ];
};

const getImprovementTips = (
    exercise: WorkoutVideoExercise,
    metrics: WorkoutVideoMetric[],
) => {
    const sorted = [...metrics].sort((a, b) => a.score - b.score);
    const lowest = sorted.slice(0, 2).map((item) => item.key);

    const map: Record<WorkoutVideoExercise, Record<WorkoutVideoMetric['key'], string>> = {
        pushups: {
            range: 'Lower your chest slightly deeper each rep to improve range.',
            tempo: 'Slow your lowering phase to around 2 seconds for cleaner control.',
            stability: 'Brace your core and squeeze glutes to avoid hip sag.',
        },
        squats: {
            range: 'Aim to hit at least parallel depth on each squat.',
            tempo: 'Use a steady 2-1-1 rhythm: down, pause, up.',
            stability: 'Keep knees tracking over toes and chest lifted.',
        },
        lunges: {
            range: 'Drop your rear knee a little lower each rep.',
            tempo: 'Reduce rushing by pausing briefly at the bottom.',
            stability: 'Keep your front foot planted and torso tall.',
        },
        plank: {
            range: 'Keep a straight line from shoulders to ankles the whole hold.',
            tempo: 'Breathe in a controlled cadence instead of holding breath.',
            stability: 'Push through elbows and brace glutes to reduce sway.',
        },
        burpees: {
            range: 'Use full extension at the top of each rep.',
            tempo: 'Keep a consistent pace rather than sprinting early reps.',
            stability: 'Land softly and stay stacked through your trunk.',
        },
    };

    return lowest.map((key) => map[exercise][key]);
};

export default function WorkoutRecordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ exercise?: string | string[] }>();
    const initialExercise = getExerciseParam(params.exercise);

    const { addAssessment, assessments, getBaselineScore, markSavedToLibrary } = useWorkoutVideoStore();

    const [selectedExercise, setSelectedExercise] = useState<WorkoutVideoExercise>(initialExercise);
    const [repsText, setRepsText] = useState('15');
    const [isRecording, setIsRecording] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [latestResult, setLatestResult] = useState<WorkoutVideoAssessment | null>(null);

    const selectedMeta = useMemo(
        () => exerciseOptions.find((item) => item.id === selectedExercise) ?? exerciseOptions[0],
        [selectedExercise],
    );

    const recentForExercise = assessments
        .filter((item) => item.exercise === selectedExercise)
        .slice(0, 3);

    const handleRecordVideo = async () => {
        try {
            setIsRecording(true);

            const camPerm = await ImagePicker.requestCameraPermissionsAsync();
            if (!camPerm.granted) {
                Alert.alert('Camera required', 'Please allow camera access to record your workout.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                quality: 1,
                videoMaxDuration: 90,
            });

            if (result.canceled || result.assets.length === 0) {
                return;
            }

            const asset = result.assets[0];
            const durationSec = Math.max(5, Math.round((asset.duration ?? 0) / 1000));
            const repCount = Math.max(1, Number.parseInt(repsText || '0', 10) || 1);
            const metrics = getMetrics(selectedExercise, durationSec, repCount);
            const base = metrics.reduce((sum, item) => sum + item.score, 0) / metrics.length;
            const score = clamp(Math.round(base + exerciseBias[selectedExercise]), 40, 100);
            const existingBaseline = getBaselineScore(selectedExercise);
            const baselineScore = existingBaseline ?? score;
            const improvementAreas = getImprovementTips(selectedExercise, metrics);

            const assessment: WorkoutVideoAssessment = {
                id: `video-${Date.now()}`,
                exercise: selectedExercise,
                uri: asset.uri,
                createdAt: new Date().toISOString(),
                score,
                baselineScore,
                deltaFromBaseline: score - baselineScore,
                durationSec,
                repCount,
                metrics,
                improvementAreas,
                savedToLibrary: false,
            };

            addAssessment(assessment);
            setLatestResult(assessment);
        } catch (error) {
            console.warn('Video capture failed', error);
            Alert.alert('Could not record', 'Please try recording again.');
        } finally {
            setIsRecording(false);
        }
    };

    const handleSaveVideo = async () => {
        if (!latestResult || latestResult.savedToLibrary) {
            return;
        }

        try {
            setIsSaving(true);
            const permission = await MediaLibrary.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Photos access required', 'Allow Photos access to save videos to your phone.');
                return;
            }

            await MediaLibrary.createAssetAsync(latestResult.uri);
            markSavedToLibrary(latestResult.id);
            setLatestResult({
                ...latestResult,
                savedToLibrary: true,
            });
            Alert.alert('Saved', 'Workout video saved to your phone.');
        } catch (error) {
            console.warn('Saving video failed', error);
            Alert.alert('Save failed', 'Could not save your video right now.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => safeBack(router, '/workouts')}>
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Record & Score</Text>
                <View style={styles.headerBtn} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Select exercise</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseRow}>
                    {exerciseOptions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.exerciseChip, selectedExercise === item.id && styles.exerciseChipActive]}
                            onPress={() => setSelectedExercise(item.id)}
                        >
                            <Ionicons
                                name={item.icon}
                                size={16}
                                color={selectedExercise === item.id ? colors.primary : colors.textSecondary}
                            />
                            <Text style={[styles.exerciseChipText, selectedExercise === item.id && styles.exerciseChipTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Card style={styles.tipCard}>
                    <Text style={styles.tipTitle}>Quick form cue</Text>
                    {selectedMeta.tips.map((tip) => (
                        <View key={tip} style={styles.tipRow}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </Card>

                <Input
                    label="Rep count (estimate)"
                    value={repsText}
                    onChangeText={setRepsText}
                    keyboardType="numeric"
                    placeholder="15"
                />

                <Button
                    title={isRecording ? 'Recording…' : 'Record Workout Video'}
                    onPress={handleRecordVideo}
                    loading={isRecording}
                    size="lg"
                />

                {latestResult && (
                    <Card style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Text style={styles.resultTitle}>Session metrics</Text>
                            <View style={styles.scorePill}>
                                <Text style={styles.scorePillText}>{latestResult.score}/100</Text>
                            </View>
                        </View>

                        <View style={styles.metricRowTop}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>Starting score</Text>
                                <Text style={styles.metricValue}>{latestResult.baselineScore}</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>Current score</Text>
                                <Text style={styles.metricValue}>{latestResult.score}</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>Progress</Text>
                                <Text
                                    style={[
                                        styles.metricValue,
                                        { color: latestResult.deltaFromBaseline >= 0 ? colors.success : colors.error },
                                    ]}
                                >
                                    {latestResult.deltaFromBaseline >= 0 ? '+' : ''}
                                    {latestResult.deltaFromBaseline}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metricRowTop}>
                            {latestResult.metrics.map((metric) => (
                                <View key={metric.key} style={styles.breakdownRow}>
                                    <Text style={styles.breakdownLabel}>{metric.label}</Text>
                                    <Text style={styles.breakdownScore}>{metric.score}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.improveTitle}>What to improve next</Text>
                        {latestResult.improvementAreas.map((tip) => (
                            <View key={tip} style={styles.improveRow}>
                                <Ionicons name="sparkles" size={14} color={colors.warning} />
                                <Text style={styles.improveText}>{tip}</Text>
                            </View>
                        ))}

                        <Button
                            title={latestResult.savedToLibrary ? 'Saved to phone' : (isSaving ? 'Saving…' : 'Save video to phone')}
                            onPress={handleSaveVideo}
                            loading={isSaving}
                            disabled={latestResult.savedToLibrary}
                            variant={latestResult.savedToLibrary ? 'secondary' : 'primary'}
                            style={{ marginTop: spacing.lg }}
                        />
                    </Card>
                )}

                {recentForExercise.length > 0 && (
                    <Card style={styles.historyCard}>
                        <Text style={styles.historyTitle}>Recent {selectedMeta.label} scores</Text>
                        {recentForExercise.map((item) => (
                            <View key={item.id} style={styles.historyRow}>
                                <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                <Text style={styles.historyScore}>{item.score}/100</Text>
                            </View>
                        ))}
                    </Card>
                )}

                <View style={{ height: spacing.xxxl }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...typography.h3, color: colors.textPrimary },
    content: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    exerciseRow: {
        gap: spacing.sm,
        paddingBottom: spacing.md,
    },
    exerciseChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    exerciseChipActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryGlow,
    },
    exerciseChipText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    exerciseChipTextActive: { color: colors.primary },
    tipCard: { marginBottom: spacing.md },
    tipTitle: {
        ...typography.subhead,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        fontWeight: '700',
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    tipText: { ...typography.caption, color: colors.textSecondary },
    resultCard: { marginTop: spacing.lg },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resultTitle: { ...typography.h3, color: colors.textPrimary },
    scorePill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primaryGlow,
        borderWidth: 1,
        borderColor: colors.primary + '40',
    },
    scorePillText: { ...typography.captionBold, color: colors.primary },
    metricRowTop: { marginTop: spacing.md, gap: spacing.sm },
    metricBox: {
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    metricLabel: { ...typography.caption, color: colors.textTertiary },
    metricValue: { ...typography.h2, color: colors.textPrimary, marginTop: 2 },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    breakdownLabel: { ...typography.caption, color: colors.textSecondary },
    breakdownScore: { ...typography.bodyBold, color: colors.textPrimary },
    improveTitle: {
        ...typography.subhead,
        color: colors.textPrimary,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        fontWeight: '700',
    },
    improveRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginBottom: spacing.xs,
        alignItems: 'center',
    },
    improveText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    historyCard: { marginTop: spacing.lg },
    historyTitle: { ...typography.subhead, color: colors.textPrimary, marginBottom: spacing.sm, fontWeight: '700' },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    historyDate: { ...typography.caption, color: colors.textSecondary },
    historyScore: { ...typography.bodyBold, color: colors.primary },
});
