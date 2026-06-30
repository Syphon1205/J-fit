export type OverloadDecision = 'increase' | 'micro_increase' | 'hold' | 'reduce' | 'deload';

export interface OverloadInput {
    exerciseId: string;
    exerciseName: string;
    targetReps: number;
    achievedReps: number;
    loadKg: number;
    targetRpe: number;
    actualRpe: number;
    incrementKg?: number;
    recentOutcomes?: Array<{
        achievedReps: number;
        actualRpe: number;
        loadKg: number;
    }>;
}

export interface OverloadResult {
    decision: OverloadDecision;
    nextLoadKg: number;
    volumeAdjustment: number;
    confidence: 'low' | 'medium' | 'high';
    rationale: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundTo = (value: number, increment: number) => Math.round(value / increment) * increment;

function recentMissCount(input: OverloadInput) {
    return (input.recentOutcomes ?? []).filter((entry) =>
        entry.achievedReps < input.targetReps || entry.actualRpe >= input.targetRpe + 1
    ).length;
}

function confidenceForHistory(input: OverloadInput): OverloadResult['confidence'] {
    const count = input.recentOutcomes?.length ?? 0;
    if (count >= 3) return 'high';
    if (count >= 1) return 'medium';
    return 'low';
}

export function calculateProgressiveOverload(input: OverloadInput): OverloadResult {
    const increment = input.incrementKg ?? 2.5;
    const repDelta = input.achievedReps - input.targetReps;
    const rpeDelta = input.actualRpe - input.targetRpe;
    const misses = recentMissCount(input);

    if (misses >= 3) {
        const nextLoadKg = roundTo(Math.max(0, input.loadKg * 0.92), increment);
        return {
            decision: 'deload',
            nextLoadKg,
            volumeAdjustment: -0.35,
            confidence: confidenceForHistory(input),
            rationale: 'Recent sessions show repeated missed targets or excessive RPE. Pull load and volume down to restore momentum.',
        };
    }

    if (repDelta >= 1 && rpeDelta <= -1) {
        return {
            decision: 'increase',
            nextLoadKg: roundTo(input.loadKg + increment, increment),
            volumeAdjustment: 0,
            confidence: confidenceForHistory(input),
            rationale: 'You beat the rep target while staying meaningfully under the planned RPE. Increase load next session.',
        };
    }

    if (repDelta >= 0 && rpeDelta <= -0.5) {
        return {
            decision: 'micro_increase',
            nextLoadKg: roundTo(input.loadKg + (increment / 2), increment / 2),
            volumeAdjustment: 0,
            confidence: confidenceForHistory(input),
            rationale: 'You met the work with room in reserve. A micro-loading jump is the cleanest progression.',
        };
    }

    if (repDelta >= 0 && rpeDelta <= 0.5) {
        return {
            decision: 'hold',
            nextLoadKg: input.loadKg,
            volumeAdjustment: 0,
            confidence: confidenceForHistory(input),
            rationale: 'Execution matched the plan closely. Hold load and focus on cleaner execution or added rep quality.',
        };
    }

    if (repDelta < 0 || rpeDelta > 0.5) {
        const nextLoadKg = roundTo(Math.max(0, input.loadKg - increment), increment);
        const shouldReduce = input.actualRpe >= input.targetRpe + 1 || input.achievedReps <= input.targetReps - 2;

        return {
            decision: shouldReduce ? 'reduce' : 'hold',
            nextLoadKg: shouldReduce ? nextLoadKg : input.loadKg,
            volumeAdjustment: shouldReduce ? -0.1 : 0,
            confidence: confidenceForHistory(input),
            rationale: shouldReduce
                ? 'The set overshot the intended effort or missed the rep target. Reduce stress slightly to keep progression sustainable.'
                : 'The set was harder than planned. Hold load and repeat until RPE stabilizes.',
        };
    }

    return {
        decision: 'hold',
        nextLoadKg: clamp(input.loadKg, 0, Number.MAX_SAFE_INTEGER),
        volumeAdjustment: 0,
        confidence: confidenceForHistory(input),
        rationale: 'Performance is neutral. Hold the current prescription.',
    };
}
