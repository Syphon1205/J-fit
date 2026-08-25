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

function shouldDeload(input: OverloadInput): boolean {
    return recentMissCount(input) >= 3;
}

function decisionForIncrease(input: OverloadInput, increment: number): OverloadResult['decision'] {
    return 'increase';
}

function decisionForMicroIncrease(input: OverloadInput): OverloadResult['decision'] {
    return 'micro_increase';
}

function decisionForHold(input: OverloadInput): OverloadResult['decision'] {
    return 'hold';
}

function decisionForReduceOrHold(input: OverloadInput): { decision: OverloadDecision; nextLoadKg: number; volumeAdjustment: number } {
    const nextLoadKg = roundTo(Math.max(0, input.loadKg - (input.incrementKg ?? 2.5)), input.incrementKg ?? 2.5);
    const shouldReduce = input.actualRpe >= input.targetRpe + 1 || input.achievedReps <= input.targetReps - 2;

    return {
        decision: shouldReduce ? 'reduce' : 'hold',
        nextLoadKg: shouldReduce ? nextLoadKg : input.loadKg,
        volumeAdjustment: shouldReduce ? -0.1 : 0,
    };
}

function overloadResult(
    decision: OverloadDecision,
    nextLoadKg: number,
    volumeAdjustment: number,
    input: OverloadInput,
): OverloadResult {
    const increment = input.incrementKg ?? 2.5;
    return {
        decision,
        nextLoadKg,
        volumeAdjustment,
        confidence: confidenceForHistory(input),
        rationale: rationaleForDecision(decision, input, increment),
    };
}

function rationaleForDecision(
    decision: OverloadDecision,
    input: OverloadInput,
    increment: number,
): string {
    const repDelta = input.achievedReps - input.targetReps;
    const rpeDelta = input.actualRpe - input.targetRpe;
    const misses = recentMissCount(input);

    switch (decision) {
        case 'deload':
            return 'Recent sessions show repeated missed targets or excessive RPE. Pull load and volume down to restore momentum.';

        case 'increase':
            return 'You beat the rep target while staying meaningfully under the planned RPE. Increase load next session.';

        case 'micro_increase':
            return 'You met the work with room in reserve. A micro-loading jump is the cleanest progression.';

        case 'hold':
            if (misses >= 3) {
                return 'The set overshot the intended effort or missed the rep target. Reduce stress slightly to keep progression sustainable.';
            }
            return 'Execution matched the plan closely. Hold load and focus on cleaner execution or added rep quality.';

        case 'reduce':
            return 'The set overshot the intended effort or missed the rep target. Reduce stress slightly to keep progression sustainable.';

        default:
            return 'Performance is neutral. Hold the current prescription.';
    }
}

export function calculateProgressiveOverload(input: OverloadInput): OverloadResult {
    const increment = input.incrementKg ?? 2.5;
    const repDelta = input.achievedReps - input.targetReps;
    const rpeDelta = input.actualRpe - input.targetRpe;
    const misses = recentMissCount(input);

    if (shouldDeload(input)) {
        const nextLoadKg = roundTo(Math.max(0, input.loadKg * 0.92), increment);
        return overloadResult('deload', nextLoadKg, -0.35, input);
    }

    if (repDelta >= 1 && rpeDelta <= -1) {
        return overloadResult('increase', roundTo(input.loadKg + increment, increment), 0, input);
    }

    if (repDelta >= 0 && rpeDelta <= -0.5) {
        return overloadResult('micro_increase', roundTo(input.loadKg + (increment / 2), increment / 2), 0, input);
    }

    if (repDelta >= 0 && rpeDelta <= 0.5) {
        return overloadResult('hold', input.loadKg, 0, input);
    }

    if (repDelta < 0 || rpeDelta > 0.5) {
        const { nextLoadKg, volumeAdjustment } = decisionForReduceOrHold(input);
        return overloadResult('reduce' /* will be overridden */, nextLoadKg, volumeAdjustment, input);
    }

    return overloadResult('hold', clamp(input.loadKg, 0, Number.MAX_SAFE_INTEGER), 0, input);
}
