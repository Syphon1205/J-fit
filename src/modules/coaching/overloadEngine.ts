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

function decisionForReduceOrHold(input: OverloadInput): {
    decision: Extract<OverloadDecision, 'reduce' | 'hold'>;
    nextLoadKg: number;
    volumeAdjustment: number;
} {
    const increment = input.incrementKg ?? 2.5;
    const nextLoadKg = roundTo(Math.max(0, input.loadKg - increment), increment);
    const shouldReduce = input.actualRpe >= input.targetRpe + 1 || input.achievedReps <= input.targetReps - 2;

    return {
        decision: shouldReduce ? 'reduce' : 'hold',
        nextLoadKg: shouldReduce ? nextLoadKg : input.loadKg,
        volumeAdjustment: shouldReduce ? -0.1 : 0,
    };
}

function rationaleForDecision(
    decision: OverloadDecision,
    softHold: boolean,
): string {
    switch (decision) {
        case 'deload':
            return 'Recent sessions show repeated missed targets or excessive RPE. Pull load and volume down to restore momentum.';

        case 'increase':
            return 'You beat the rep target while staying meaningfully under the planned RPE. Increase load next session.';

        case 'micro_increase':
            return 'You met the work with room in reserve. A micro-loading jump is the cleanest progression.';

        case 'hold':
            if (softHold) {
                return 'The set was harder than planned. Hold load and repeat until RPE stabilizes.';
            }
            return 'Execution matched the plan closely. Hold load and focus on cleaner execution or added rep quality.';

        case 'reduce':
            return 'The set overshot the intended effort or missed the rep target. Reduce stress slightly to keep progression sustainable.';

        default:
            return 'Performance is neutral. Hold the current prescription.';
    }
}

function overloadResult(
    decision: OverloadDecision,
    nextLoadKg: number,
    volumeAdjustment: number,
    input: OverloadInput,
    softHold = false,
): OverloadResult {
    return {
        decision,
        nextLoadKg,
        volumeAdjustment,
        confidence: confidenceForHistory(input),
        rationale: rationaleForDecision(decision, softHold),
    };
}

export function calculateProgressiveOverload(input: OverloadInput): OverloadResult {
    const increment = input.incrementKg ?? 2.5;
    const repDelta = input.achievedReps - input.targetReps;
    const rpeDelta = input.actualRpe - input.targetRpe;

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
        const { decision, nextLoadKg, volumeAdjustment } = decisionForReduceOrHold(input);
        return overloadResult(decision, nextLoadKg, volumeAdjustment, input, decision === 'hold');
    }

    return overloadResult('hold', clamp(input.loadKg, 0, Number.MAX_SAFE_INTEGER), 0, input);
}
