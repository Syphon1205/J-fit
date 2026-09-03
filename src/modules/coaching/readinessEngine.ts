export type ReadinessBand = 'recovery' | 'baseline' | 'performance';
export type CoachingAction = 'deload' | 'execute' | 'push_pr';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface DailyReadinessInput {
    sleepHours: number;
    sleepQualityScore: number; // 0-100
    restingHeartRateDeltaBpm: number; // current minus rolling baseline
    fatigueScore: number; // 1-5, higher is worse
    hrvDeltaPercent?: number; // vs baseline, negative is worse
    sorenessScore?: number; // 1-5, higher is worse
    motivationScore?: number; // 1-5, higher is better
    trainingLoadLast72h?: number; // 0-100
    nutritionCompliancePercent?: number; // 0-100
}

export interface ReadinessFactorBreakdown {
    key: 'sleep_quantity' | 'sleep_quality' | 'resting_hr' | 'hrv' | 'fatigue' | 'soreness' | 'motivation' | 'training_load' | 'nutrition';
    label: string;
    score: number; // 0-100 normalized sub-score
    weight: number;
    impact: number; // weighted contribution in points
    direction: 'positive' | 'negative' | 'neutral';
    detail: string;
}

export interface ReadinessAdjustment {
    volumeScale: number;
    intensityScale: number;
    restSecondsDelta: number;
    allowPR: boolean;
    removeTopSet: boolean;
}

export interface DailyReadinessResult {
    score: number;
    band: ReadinessBand;
    action: CoachingAction;
    confidence: ConfidenceLevel;
    factors: ReadinessFactorBreakdown[];
    rationale: string[];
    adjustment: ReadinessAdjustment;
    uiCopy: {
        headline: string;
        body: string;
        cta: string;
    };
}

type WeightedFactor = {
    key: ReadinessFactorBreakdown['key'];
    label: string;
    weight: number;
    score: number;
    detail: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;

function scoreSleepHours(hours: number) {
    if (hours >= 8.5) return 100;
    if (hours >= 8) return 94;
    if (hours >= 7.5) return 88;
    if (hours >= 7) return 80;
    if (hours >= 6.5) return 68;
    if (hours >= 6) return 55;
    if (hours >= 5.5) return 40;
    return 20;
}

function scoreRestingHeartRateDelta(deltaBpm: number) {
    if (deltaBpm <= -4) return 96;
    if (deltaBpm <= -2) return 88;
    if (deltaBpm <= 1) return 80;
    if (deltaBpm <= 3) return 65;
    if (deltaBpm <= 5) return 50;
    if (deltaBpm <= 7) return 35;
    return 20;
}

function scoreHrvDelta(deltaPercent?: number) {
    if (deltaPercent == null) return null;
    if (deltaPercent >= 12) return 96;
    if (deltaPercent >= 6) return 90;
    if (deltaPercent >= 0) return 80;
    if (deltaPercent >= -5) return 68;
    if (deltaPercent >= -10) return 52;
    if (deltaPercent >= -18) return 34;
    return 20;
}

function scoreFatigue(value: number) {
    const normalized = clamp(value, 1, 5);
    return [100, 82, 64, 38, 18][normalized - 1];
}

function scoreSoreness(value?: number) {
    if (value == null) return null;
    const normalized = clamp(value, 1, 5);
    return [92, 78, 62, 40, 22][normalized - 1];
}

function scoreMotivation(value?: number) {
    if (value == null) return null;
    const normalized = clamp(value, 1, 5);
    return [35, 52, 68, 84, 96][normalized - 1];
}

function scoreTrainingLoad(value?: number) {
    if (value == null) return null;
    const normalized = clamp(value, 0, 100);
    if (normalized <= 35) return 88;
    if (normalized <= 55) return 78;
    if (normalized <= 70) return 62;
    if (normalized <= 85) return 42;
    return 24;
}

function scoreNutrition(value?: number) {
    if (value == null) return null;
    const normalized = clamp(value, 0, 100);
    if (normalized >= 95) return 92;
    if (normalized >= 85) return 82;
    if (normalized >= 75) return 68;
    if (normalized >= 60) return 52;
    return 34;
}

function confidenceForAvailableSignals(optionalSignalCount: number): ConfidenceLevel {
    if (optionalSignalCount >= 4) return 'high';
    if (optionalSignalCount >= 2) return 'medium';
    return 'low';
}

function toFactor(factor: WeightedFactor, totalWeight: number): ReadinessFactorBreakdown {
    const normalizedWeight = totalWeight > 0 ? (factor.weight / totalWeight) * 100 : 0;
    const impact = round((factor.score * normalizedWeight) / 100);
    return {
        ...factor,
        weight: round(normalizedWeight),
        impact,
        direction: factor.score >= 75 ? 'positive' : factor.score <= 45 ? 'negative' : 'neutral',
    };
}

function buildRationale(factors: ReadinessFactorBreakdown[]) {
    const sorted = [...factors].sort((a, b) => b.impact - a.impact);
    const strongest = sorted[0];
    const weakest = [...factors].sort((a, b) => a.score - b.score)[0];

    const rationale = [];
    if (strongest) rationale.push(`${strongest.label} is supporting performance today.`);
    if (weakest && weakest !== strongest) rationale.push(`${weakest.label} is the main limiter right now.`);
    return rationale;
}

function buildUiCopy(band: ReadinessBand, score: number): DailyReadinessResult['uiCopy'] {
    if (band === 'recovery') {
        return {
            headline: `Capacity ${score}: Recovery first`,
            body: 'Your recovery markers are suppressed. Shift today into a lower-stress training day.',
            cta: 'Accept De-load',
        };
    }

    if (band === 'performance') {
        return {
            headline: `Capacity ${score}: Performance window`,
            body: 'Warm-ups permitting, today supports a top set, progression, or PR attempt.',
            cta: 'Enter PR Mode',
        };
    }

    return {
        headline: `Capacity ${score}: On plan`,
        body: 'Your signals support the scheduled session as written.',
        cta: 'Run Today\'s Plan',
    };
}

function computeFactorCandidates(input: DailyReadinessInput): WeightedFactor[] {
    const factorCandidates: WeightedFactor[] = [
        {
            key: 'sleep_quantity',
            label: 'Sleep Quantity',
            weight: 20,
            score: scoreSleepHours(input.sleepHours),
            detail: `${round(input.sleepHours)}h sleep`,
        },
        {
            key: 'sleep_quality',
            label: 'Sleep Quality',
            weight: 20,
            score: clamp(input.sleepQualityScore, 0, 100),
            detail: `${clamp(input.sleepQualityScore, 0, 100)}/100 quality`,
        },
        {
            key: 'resting_hr',
            label: 'Resting Heart Rate',
            weight: 20,
            score: scoreRestingHeartRateDelta(input.restingHeartRateDeltaBpm),
            detail: `${input.restingHeartRateDeltaBpm >= 0 ? '+' : ''}${input.restingHeartRateDeltaBpm} bpm vs baseline`,
        },
        {
            key: 'fatigue',
            label: 'Subjective Fatigue',
            weight: 15,
            score: scoreFatigue(input.fatigueScore),
            detail: `${clamp(input.fatigueScore, 1, 5)}/5 fatigue`,
        },
    ];

    const optionalFactorMap: Array<WeightedFactor | null> = [
        input.hrvDeltaPercent != null ? {
            key: 'hrv',
            label: 'HRV Trend',
            weight: 15,
            score: scoreHrvDelta(input.hrvDeltaPercent) as number,
            detail: `${input.hrvDeltaPercent >= 0 ? '+' : ''}${input.hrvDeltaPercent}% vs baseline`,
        } : null,
        input.sorenessScore != null ? {
            key: 'soreness',
            label: 'Soreness',
            weight: 5,
            score: scoreSoreness(input.sorenessScore) as number,
            detail: `${clamp(input.sorenessScore, 1, 5)}/5 soreness`,
        } : null,
        input.motivationScore != null ? {
            key: 'motivation',
            label: 'Motivation',
            weight: 5,
            score: scoreMotivation(input.motivationScore) as number,
            detail: `${clamp(input.motivationScore, 1, 5)}/5 motivation`,
        } : null,
        input.trainingLoadLast72h != null ? {
            key: 'training_load',
            label: 'Recent Training Load',
            weight: 5,
            score: scoreTrainingLoad(input.trainingLoadLast72h) as number,
            detail: `${clamp(input.trainingLoadLast72h, 0, 100)}/100 load`,
        } : null,
        input.nutritionCompliancePercent != null ? {
            key: 'nutrition',
            label: 'Nutrition Compliance',
            weight: 5,
            score: scoreNutrition(input.nutritionCompliancePercent) as number,
            detail: `${clamp(input.nutritionCompliancePercent, 0, 100)}% target adherence`,
        } : null,
    ];

    optionalFactorMap.forEach((factor) => {
        if (factor) factorCandidates.push(factor);
    });

    return factorCandidates;
}

function determineBandAndScore(
    factors: ReadinessFactorBreakdown[],
    input: DailyReadinessInput,
): { score: number; band: ReadinessBand; action: CoachingAction } {
    const weightedScore = factors.reduce((sum, factor) => sum + factor.impact, 0);

    const recoveryFlags = [
        input.sleepHours < 5.5,
        input.restingHeartRateDeltaBpm >= 8,
        (input.hrvDeltaPercent ?? 0) <= -18,
        input.fatigueScore >= 5,
    ].filter(Boolean).length;

    const prSuppressed = (input.sorenessScore ?? 0) >= 4
        || (input.trainingLoadLast72h ?? 0) >= 85
        || (input.nutritionCompliancePercent ?? 100) < 60;

    let score = clamp(Math.round(weightedScore), 0, 100);
    let band: ReadinessBand = 'baseline';
    let action: CoachingAction = 'execute';

    if (recoveryFlags >= 2 || score <= 44) {
        band = 'recovery';
        action = 'deload';
        score = Math.min(score, 44);
    } else if (score >= 75 && !prSuppressed) {
        band = 'performance';
        action = 'push_pr';
    }

    return { score, band, action };
}

function computeAdjustment(band: ReadinessBand): ReadinessAdjustment {
    if (band === 'recovery') {
        return {
            volumeScale: 0.65,
            intensityScale: 0.92,
            restSecondsDelta: 30,
            allowPR: false,
            removeTopSet: true,
        };
    }

    if (band === 'performance') {
        return {
            volumeScale: 1,
            intensityScale: 1.03,
            restSecondsDelta: 0,
            allowPR: true,
            removeTopSet: false,
        };
    }

    return {
        volumeScale: 1,
        intensityScale: 1,
        restSecondsDelta: 0,
        allowPR: false,
        removeTopSet: false,
    };
}

export function calculateDailyPerformanceCapacity(input: DailyReadinessInput): DailyReadinessResult {
    const optionalSignalCount = [
        input.hrvDeltaPercent,
        input.sorenessScore,
        input.motivationScore,
        input.trainingLoadLast72h,
        input.nutritionCompliancePercent,
    ].filter((value) => value != null).length;

    const factorCandidates = computeFactorCandidates(input);
    const totalWeight = factorCandidates.reduce((sum, factor) => sum + factor.weight, 0);
    const factors = factorCandidates
        .map((factor) => toFactor(factor, totalWeight))
        .sort((a, b) => b.impact - a.impact);

    const { score, band, action } = determineBandAndScore(factors, input);
    const rationale = buildRationale(factors);

    if (band === 'recovery') {
        rationale.push('A reduced-stress session is the best trade-off for performance retention and recovery.');
    } else if (band === 'performance') {
        rationale.push('If warm-up velocity feels sharp, expose a top set or PR attempt.');
    } else {
        rationale.push('Today is suitable for executing the programmed session without major changes.');
    }

    return {
        score,
        band,
        action,
        confidence: confidenceForAvailableSignals(optionalSignalCount),
        factors,
        rationale,
        adjustment: computeAdjustment(band),
        uiCopy: buildUiCopy(band, score),
    };
}
