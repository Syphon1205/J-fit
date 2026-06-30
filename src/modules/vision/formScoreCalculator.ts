import { LiftType, MotionPhase, RepAnalysis } from './visionFormEngine';

export type FormFaultKey =
    | 'knee_valgus'
    | 'spine_flexion'
    | 'bar_path_drift'
    | 'velocity_collapse'
    | 'depth_shortfall'
    | 'lockout_soft'
    | 'rib_flare'
    | 'elbow_stack_loss';

export interface FormFault {
    key: FormFaultKey;
    phase: MotionPhase;
    severity: 'minor' | 'moderate' | 'major';
    penalty: number;
    detail: string;
}

export interface RepCritique {
    repIndex: number;
    score: number;
    confidence: number;
    faults: FormFault[];
    primaryIssue: string | null;
}

export interface SessionFormScore {
    sessionScore: number;
    repScores: RepCritique[];
    categoryScores: {
        alignment: number;
        barPath: number;
        tempo: number;
        stability: number;
        completion: number;
    };
    recommendedCue: string | null;
}

const CATEGORY_WEIGHTS = {
    alignment: 0.4,
    barPath: 0.25,
    tempo: 0.15,
    stability: 0.1,
    completion: 0.1,
};

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
    return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function penaltyForSeverity(severity: FormFault['severity']) {
    return severity === 'major' ? 16 : severity === 'moderate' ? 9 : 4;
}

function inferFaultKey(metric: string, lift: LiftType): FormFaultKey {
    if (metric === 'bar_path') return 'bar_path_drift';
    if (metric.includes('spine')) return lift === 'overhead_press' ? 'rib_flare' : 'spine_flexion';
    if (metric.includes('knee')) return 'knee_valgus';
    if (metric.includes('elbow')) return 'elbow_stack_loss';
    if (metric.includes('hip') && lift === 'squat') return 'depth_shortfall';
    return 'lockout_soft';
}

export function scoreRepForm(lift: LiftType, analysis: RepAnalysis): RepCritique {
    const faults: FormFault[] = analysis.deviations.map((deviation) => {
        const key = inferFaultKey(deviation.metric, lift);
        const penalty = penaltyForSeverity(deviation.severity) + Math.min(12, deviation.magnitude * 0.4);
        return {
            key,
            phase: deviation.phase,
            severity: deviation.severity,
            penalty: Number(penalty.toFixed(1)),
            detail: deviation.detail,
        };
    });

    if (analysis.summary.maxVelocityLoss > 0.35) {
        faults.push({
            key: 'velocity_collapse',
            phase: 'concentric',
            severity: analysis.summary.maxVelocityLoss > 0.5 ? 'major' : 'moderate',
            penalty: Number((analysis.summary.maxVelocityLoss * 22).toFixed(1)),
            detail: 'Bar speed fell off sharply during the working phase of the rep.',
        });
    }

    const alignmentPenalty = faults
        .filter((fault) => ['knee_valgus', 'spine_flexion', 'rib_flare', 'elbow_stack_loss'].includes(fault.key))
        .reduce((sum, fault) => sum + fault.penalty, 0);
    const barPathPenalty = faults
        .filter((fault) => fault.key === 'bar_path_drift')
        .reduce((sum, fault) => sum + fault.penalty, 0);
    const tempoPenalty = faults
        .filter((fault) => fault.key === 'velocity_collapse')
        .reduce((sum, fault) => sum + fault.penalty, 0);
    const stabilityPenalty = analysis.summary.symmetryDelta > 12 ? Math.min(16, analysis.summary.symmetryDelta * 0.7) : 0;
    const completionPenalty = faults
        .filter((fault) => ['depth_shortfall', 'lockout_soft'].includes(fault.key))
        .reduce((sum, fault) => sum + fault.penalty, 0);

    const categoryScores = {
        alignment: clamp(100 - alignmentPenalty, 0, 100),
        barPath: clamp(100 - barPathPenalty, 0, 100),
        tempo: clamp(100 - tempoPenalty, 0, 100),
        stability: clamp(100 - stabilityPenalty, 0, 100),
        completion: clamp(100 - completionPenalty, 0, 100),
    };

    const weightedScore =
        categoryScores.alignment * CATEGORY_WEIGHTS.alignment
        + categoryScores.barPath * CATEGORY_WEIGHTS.barPath
        + categoryScores.tempo * CATEGORY_WEIGHTS.tempo
        + categoryScores.stability * CATEGORY_WEIGHTS.stability
        + categoryScores.completion * CATEGORY_WEIGHTS.completion;

    const confidencePenalty = analysis.confidence < 0.65 ? (0.65 - analysis.confidence) * 20 : 0;
    const score = Math.round(clamp(weightedScore - confidencePenalty, 0, 100));
    const primaryFault = [...faults].sort((a, b) => b.penalty - a.penalty)[0];

    return {
        repIndex: analysis.repIndex,
        score,
        confidence: analysis.confidence,
        faults: faults.sort((a, b) => b.penalty - a.penalty),
        primaryIssue: primaryFault ? primaryFault.detail : null,
    };
}

export function scoreLiftSession(lift: LiftType, reps: RepAnalysis[]): SessionFormScore {
    const repScores = reps.map((rep) => scoreRepForm(lift, rep));
    const sessionScore = Math.round(average(repScores.map((rep) => rep.score)));

    const categoryScores = repScores.reduce((acc, rep) => {
        const alignmentFaults = rep.faults.filter((fault) => ['knee_valgus', 'spine_flexion', 'rib_flare', 'elbow_stack_loss'].includes(fault.key)).length;
        const barPathFaults = rep.faults.filter((fault) => fault.key === 'bar_path_drift').length;
        const tempoFaults = rep.faults.filter((fault) => fault.key === 'velocity_collapse').length;
        const completionFaults = rep.faults.filter((fault) => ['depth_shortfall', 'lockout_soft'].includes(fault.key)).length;

        acc.alignment.push(clamp(100 - alignmentFaults * 12, 0, 100));
        acc.barPath.push(clamp(100 - barPathFaults * 16, 0, 100));
        acc.tempo.push(clamp(100 - tempoFaults * 14, 0, 100));
        acc.stability.push(clamp(100 - rep.faults.filter((fault) => fault.key === 'knee_valgus').length * 10, 0, 100));
        acc.completion.push(clamp(100 - completionFaults * 15, 0, 100));
        return acc;
    }, {
        alignment: [] as number[],
        barPath: [] as number[],
        tempo: [] as number[],
        stability: [] as number[],
        completion: [] as number[],
    });

    const recommendedCue = repScores
        .flatMap((rep) => rep.faults)
        .sort((a, b) => b.penalty - a.penalty)[0]?.detail ?? null;

    return {
        sessionScore,
        repScores,
        categoryScores: {
            alignment: Math.round(average(categoryScores.alignment)),
            barPath: Math.round(average(categoryScores.barPath)),
            tempo: Math.round(average(categoryScores.tempo)),
            stability: Math.round(average(categoryScores.stability)),
            completion: Math.round(average(categoryScores.completion)),
        },
        recommendedCue,
    };
}
