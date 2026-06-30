export type MuscleGroup =
    | 'chest'
    | 'back'
    | 'quads'
    | 'hamstrings'
    | 'glutes'
    | 'shoulders'
    | 'biceps'
    | 'triceps'
    | 'calves'
    | 'core';

export type RecoverySuggestion = 'stay_course' | 'switch_to_pull' | 'switch_to_legs' | 'insert_recovery';

export interface CompletedSet {
    exerciseName: string;
    completedAt: string;
    sets: number;
    reps: number;
    weightKg: number;
    rpe?: number;
}

export interface MuscleLoadDistribution {
    muscle: MuscleGroup;
    share: number;
}

export interface ExerciseLoadProfile {
    exerciseName: string;
    distributions: MuscleLoadDistribution[];
}

export interface MuscleVolumeWindow {
    muscle: MuscleGroup;
    rawVolumeLoad: number;
    weightedVolumeLoad: number;
    threshold: number;
    utilization: number;
    status: 'low' | 'normal' | 'elevated' | 'critical';
}

export interface FatigueRecommendation {
    suggestion: RecoverySuggestion;
    reason: string;
    blockedSplits: string[];
    recommendedSplits: string[];
}

export interface FatigueMatrixResult {
    volumeByMuscle: Record<MuscleGroup, MuscleVolumeWindow>;
    cumulativeFatigueScore: number;
    breachedMuscles: MuscleGroup[];
    recommendation: FatigueRecommendation;
}

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
    'chest',
    'back',
    'quads',
    'hamstrings',
    'glutes',
    'shoulders',
    'biceps',
    'triceps',
    'calves',
    'core',
];

const DEFAULT_THRESHOLDS: Record<MuscleGroup, number> = {
    chest: 18000,
    back: 22000,
    quads: 26000,
    hamstrings: 20000,
    glutes: 24000,
    shoulders: 14000,
    biceps: 9000,
    triceps: 10000,
    calves: 12000,
    core: 10000,
};

const DEFAULT_PROFILES: ExerciseLoadProfile[] = [
    { exerciseName: 'Bench Press', distributions: [{ muscle: 'chest', share: 0.55 }, { muscle: 'triceps', share: 0.25 }, { muscle: 'shoulders', share: 0.2 }] },
    { exerciseName: 'Incline Dumbbell Press', distributions: [{ muscle: 'chest', share: 0.45 }, { muscle: 'shoulders', share: 0.3 }, { muscle: 'triceps', share: 0.25 }] },
    { exerciseName: 'Push-ups', distributions: [{ muscle: 'chest', share: 0.5 }, { muscle: 'triceps', share: 0.25 }, { muscle: 'shoulders', share: 0.25 }] },
    { exerciseName: 'Overhead Press', distributions: [{ muscle: 'shoulders', share: 0.55 }, { muscle: 'triceps', share: 0.3 }, { muscle: 'chest', share: 0.15 }] },
    { exerciseName: 'Cable Flyes', distributions: [{ muscle: 'chest', share: 0.8 }, { muscle: 'shoulders', share: 0.2 }] },
    { exerciseName: 'Barbell Row', distributions: [{ muscle: 'back', share: 0.65 }, { muscle: 'biceps', share: 0.2 }, { muscle: 'core', share: 0.15 }] },
    { exerciseName: 'Dumbbell Row', distributions: [{ muscle: 'back', share: 0.65 }, { muscle: 'biceps', share: 0.2 }, { muscle: 'core', share: 0.15 }] },
    { exerciseName: 'Pull-ups', distributions: [{ muscle: 'back', share: 0.6 }, { muscle: 'biceps', share: 0.25 }, { muscle: 'core', share: 0.15 }] },
    { exerciseName: 'Weighted Pull-ups', distributions: [{ muscle: 'back', share: 0.6 }, { muscle: 'biceps', share: 0.25 }, { muscle: 'core', share: 0.15 }] },
    { exerciseName: 'Deadlift', distributions: [{ muscle: 'back', share: 0.25 }, { muscle: 'hamstrings', share: 0.3 }, { muscle: 'glutes', share: 0.3 }, { muscle: 'core', share: 0.15 }] },
    { exerciseName: 'Romanian Deadlift', distributions: [{ muscle: 'hamstrings', share: 0.45 }, { muscle: 'glutes', share: 0.35 }, { muscle: 'back', share: 0.1 }, { muscle: 'core', share: 0.1 }] },
    { exerciseName: 'Barbell Squat', distributions: [{ muscle: 'quads', share: 0.4 }, { muscle: 'glutes', share: 0.35 }, { muscle: 'core', share: 0.15 }, { muscle: 'hamstrings', share: 0.1 }] },
    { exerciseName: 'Front Squat', distributions: [{ muscle: 'quads', share: 0.5 }, { muscle: 'glutes', share: 0.2 }, { muscle: 'core', share: 0.2 }, { muscle: 'hamstrings', share: 0.1 }] },
    { exerciseName: 'Leg Press', distributions: [{ muscle: 'quads', share: 0.55 }, { muscle: 'glutes', share: 0.25 }, { muscle: 'hamstrings', share: 0.2 }] },
    { exerciseName: 'Walking Lunges', distributions: [{ muscle: 'quads', share: 0.35 }, { muscle: 'glutes', share: 0.35 }, { muscle: 'hamstrings', share: 0.15 }, { muscle: 'core', share: 0.15 }] },
    { exerciseName: 'Leg Curls', distributions: [{ muscle: 'hamstrings', share: 0.85 }, { muscle: 'calves', share: 0.15 }] },
    { exerciseName: 'Calf Raises', distributions: [{ muscle: 'calves', share: 0.95 }, { muscle: 'hamstrings', share: 0.05 }] },
    { exerciseName: 'Farmers Carry', distributions: [{ muscle: 'back', share: 0.25 }, { muscle: 'core', share: 0.45 }, { muscle: 'shoulders', share: 0.15 }, { muscle: 'glutes', share: 0.15 }] },
    { exerciseName: 'Ab Wheel Rollout', distributions: [{ muscle: 'core', share: 0.85 }, { muscle: 'shoulders', share: 0.15 }] },
];

function isoDaysAgo(daysAgo: number) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}

function withinRollingWindow(timestamp: string, days: number) {
    const date = new Date(timestamp);
    return date >= isoDaysAgo(days);
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function getProfile(exerciseName: string, profiles: ExerciseLoadProfile[]) {
    return profiles.find((profile) => profile.exerciseName.toLowerCase() === exerciseName.toLowerCase());
}

function intensityMultiplier(rpe?: number) {
    if (rpe == null) return 1;
    return clamp(0.85 + ((rpe - 6) * 0.08), 0.75, 1.3);
}

export function calculateSetVolumeLoad(set: CompletedSet) {
    return Math.max(0, set.sets) * Math.max(0, set.reps) * Math.max(0, set.weightKg);
}

export function calculateCumulativeFatigueMatrix(
    sets: CompletedSet[],
    options?: {
        days?: number;
        thresholds?: Partial<Record<MuscleGroup, number>>;
        exerciseProfiles?: ExerciseLoadProfile[];
    }
): FatigueMatrixResult {
    const days = options?.days ?? 7;
    const thresholds = { ...DEFAULT_THRESHOLDS, ...options?.thresholds };
    const profiles = [...DEFAULT_PROFILES, ...(options?.exerciseProfiles ?? [])];

    const totals = Object.fromEntries(
        ALL_MUSCLE_GROUPS.map((muscle) => [muscle, 0])
    ) as Record<MuscleGroup, number>;

    sets
        .filter((set) => withinRollingWindow(set.completedAt, days))
        .forEach((set) => {
            const profile = getProfile(set.exerciseName, profiles);
            if (!profile) return;

            const setVolume = calculateSetVolumeLoad(set) * intensityMultiplier(set.rpe);
            profile.distributions.forEach(({ muscle, share }) => {
                totals[muscle] += setVolume * share;
            });
        });

    const volumeByMuscle = Object.fromEntries(
        ALL_MUSCLE_GROUPS.map((muscle) => {
            const weightedVolumeLoad = Math.round(totals[muscle]);
            const threshold = thresholds[muscle];
            const utilization = threshold > 0 ? weightedVolumeLoad / threshold : 0;
            const status =
                utilization >= 1.15 ? 'critical'
                    : utilization >= 0.9 ? 'elevated'
                        : utilization <= 0.45 ? 'low'
                            : 'normal';

            return [muscle, {
                muscle,
                rawVolumeLoad: Math.round(totals[muscle]),
                weightedVolumeLoad,
                threshold,
                utilization: Number(utilization.toFixed(2)),
                status,
            }];
        })
    ) as Record<MuscleGroup, MuscleVolumeWindow>;

    const breachedMuscles = ALL_MUSCLE_GROUPS.filter((muscle) => volumeByMuscle[muscle].status === 'critical');
    const averageUtilization = ALL_MUSCLE_GROUPS.reduce((sum, muscle) => sum + volumeByMuscle[muscle].utilization, 0) / ALL_MUSCLE_GROUPS.length;
    const cumulativeFatigueScore = Math.round(clamp(averageUtilization * 100, 0, 100));

    let recommendation: FatigueRecommendation = {
        suggestion: 'stay_course',
        reason: 'Rolling load is within acceptable thresholds for the current split.',
        blockedSplits: [],
        recommendedSplits: [],
    };

    const chestUtilization = volumeByMuscle.chest.utilization;
    if (chestUtilization >= 1) {
        recommendation = {
            suggestion: volumeByMuscle.back.utilization < volumeByMuscle.quads.utilization ? 'switch_to_pull' : 'switch_to_legs',
            reason: 'Chest volume has exceeded its 7-day threshold. Redirect the user away from another push-dominant session to reduce overuse risk.',
            blockedSplits: ['push', 'upper_push', 'chest_focus'],
            recommendedSplits: volumeByMuscle.back.utilization < volumeByMuscle.quads.utilization ? ['pull', 'posterior_chain'] : ['legs', 'lower_body'],
        };
    } else if (breachedMuscles.length >= 3 || cumulativeFatigueScore >= 88) {
        recommendation = {
            suggestion: 'insert_recovery',
            reason: 'Systemic fatigue is elevated across multiple muscle groups. Replace the next session with a recovery-biased day.',
            blockedSplits: ['high_intensity', 'full_body_power'],
            recommendedSplits: ['mobility', 'zone2', 'recovery'],
        };
    }

    return {
        volumeByMuscle,
        cumulativeFatigueScore,
        breachedMuscles,
        recommendation,
    };
}
