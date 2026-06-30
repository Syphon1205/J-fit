export type WorkoutIntensityTier = 'low' | 'moderate' | 'high' | 'max';

export interface WorkoutFuelingInput {
    completedAt: string;
    durationMinutes: number;
    caloriesBurned: number;
    intensity: WorkoutIntensityTier;
    muscleStressScore?: number; // 0-100
}

export interface DailyMacroGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface CarbAdjustmentWindow {
    startsAt: string;
    endsAt: string;
    additionalCarbs: number;
    adjustedCarbGoal: number;
    glycogenDemandScore: number;
    reason: string;
}

const INTENSITY_MULTIPLIER: Record<WorkoutIntensityTier, number> = {
    low: 0.5,
    moderate: 0.85,
    high: 1.2,
    max: 1.45,
};

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function addHours(iso: string, hours: number) {
    const date = new Date(iso);
    date.setHours(date.getHours() + hours);
    return date.toISOString();
}

export function calculateGlycogenDemandScore(input: WorkoutFuelingInput) {
    const durationScore = clamp(input.durationMinutes / 75, 0, 1);
    const calorieScore = clamp(input.caloriesBurned / 700, 0, 1);
    const intensityScore = INTENSITY_MULTIPLIER[input.intensity] / INTENSITY_MULTIPLIER.max;
    const muscleStressScore = clamp((input.muscleStressScore ?? 50) / 100, 0, 1);

    return Math.round(((durationScore * 0.3) + (calorieScore * 0.3) + (intensityScore * 0.3) + (muscleStressScore * 0.1)) * 100);
}

export function calculateContextualCarbWindow(
    workout: WorkoutFuelingInput,
    currentGoals: DailyMacroGoals
): CarbAdjustmentWindow {
    const glycogenDemandScore = calculateGlycogenDemandScore(workout);

    const baselineBoost =
        workout.intensity === 'max' ? 70
            : workout.intensity === 'high' ? 50
                : workout.intensity === 'moderate' ? 20
                    : 0;

    const scaledBoost = Math.round(baselineBoost + (glycogenDemandScore * 0.25));
    const additionalCarbs = clamp(scaledBoost, 0, 95);
    const adjustedCarbGoal = currentGoals.carbs + additionalCarbs;

    const reason =
        additionalCarbs === 0
            ? 'Session demand does not justify a carb replenishment override.'
            : `Workout demand was ${glycogenDemandScore}/100. Increase carbohydrate intake for the next 4 hours to improve glycogen replenishment.`;

    return {
        startsAt: workout.completedAt,
        endsAt: addHours(workout.completedAt, 4),
        additionalCarbs,
        adjustedCarbGoal,
        glycogenDemandScore,
        reason,
    };
}
