export type LiftType = 'squat' | 'bench' | 'deadlift' | 'overhead_press';
export type Viewpoint = 'front' | 'rear' | 'left' | 'right';
export type MotionPhase = 'setup' | 'eccentric' | 'bottom' | 'concentric' | 'lockout';

export type LandmarkName =
    | 'nose'
    | 'left_shoulder'
    | 'right_shoulder'
    | 'left_elbow'
    | 'right_elbow'
    | 'left_wrist'
    | 'right_wrist'
    | 'left_hip'
    | 'right_hip'
    | 'left_knee'
    | 'right_knee'
    | 'left_ankle'
    | 'right_ankle'
    | 'left_heel'
    | 'right_heel'
    | 'left_foot_index'
    | 'right_foot_index';

export interface PoseLandmark {
    x: number;
    y: number;
    z?: number;
    confidence: number;
}

export interface PoseFrame {
    timestampMs: number;
    landmarks: Partial<Record<LandmarkName, PoseLandmark>>;
}

export interface JointAngleSnapshot {
    leftKneeAngle?: number;
    rightKneeAngle?: number;
    leftHipAngle?: number;
    rightHipAngle?: number;
    leftElbowAngle?: number;
    rightElbowAngle?: number;
    torsoAngle?: number;
    spineInclination?: number;
}

export interface BarPathSnapshot {
    x: number;
    y: number;
    velocity: number;
}

export interface RepPhaseWindow {
    phase: MotionPhase;
    startFrame: number;
    endFrame: number;
}

export interface LiftCorridor {
    min: number;
    max: number;
}

export interface LiftGoldStandardTemplate {
    lift: LiftType;
    viewpoint: Viewpoint;
    corridors: Partial<Record<MotionPhase, Partial<Record<keyof JointAngleSnapshot, LiftCorridor>>>>;
    barPathDriftTolerance: number;
    velocityLossTolerance: number;
    symmetryTolerance: number;
}

export interface FrameKinematicSnapshot {
    frameIndex: number;
    timestampMs: number;
    confidence: number;
    angles: JointAngleSnapshot;
    barPath: BarPathSnapshot;
}

export interface RepAnalysis {
    repIndex: number;
    phases: RepPhaseWindow[];
    frames: FrameKinematicSnapshot[];
    confidence: number;
    deviations: Array<{
        metric: string;
        phase: MotionPhase;
        magnitude: number;
        severity: 'minor' | 'moderate' | 'major';
        detail: string;
    }>;
    summary: {
        barPathDrift: number;
        maxVelocityLoss: number;
        symmetryDelta: number;
    };
}

const REQUIRED_LANDMARKS: LandmarkName[] = [
    'left_shoulder',
    'right_shoulder',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
];

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
    return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPoint(frame: PoseFrame, name: LandmarkName) {
    return frame.landmarks[name];
}

function midpoint(a?: PoseLandmark, b?: PoseLandmark): PoseLandmark | undefined {
    if (!a || !b) return undefined;
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: a.z != null && b.z != null ? (a.z + b.z) / 2 : undefined,
        confidence: Math.min(a.confidence, b.confidence),
    };
}

function vectorAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark) {
    const abx = a.x - b.x;
    const aby = a.y - b.y;
    const cbx = c.x - b.x;
    const cby = c.y - b.y;
    const dot = abx * cbx + aby * cby;
    const mag1 = Math.sqrt(abx * abx + aby * aby);
    const mag2 = Math.sqrt(cbx * cbx + cby * cby);
    if (mag1 === 0 || mag2 === 0) return undefined;
    const cosine = clamp(dot / (mag1 * mag2), -1, 1);
    return (Math.acos(cosine) * 180) / Math.PI;
}

function lineAngleDegrees(a: PoseLandmark, b: PoseLandmark) {
    const radians = Math.atan2(b.y - a.y, b.x - a.x);
    return Math.abs((radians * 180) / Math.PI);
}

function frameConfidence(frame: PoseFrame) {
    const confidences = REQUIRED_LANDMARKS
        .map((name) => frame.landmarks[name]?.confidence)
        .filter((value): value is number => value != null);
    return average(confidences);
}

function getPrimarySide(viewpoint: Viewpoint) {
    return viewpoint === 'left' ? 'left' : 'right';
}

export function getDefaultGoldStandardTemplate(lift: LiftType, viewpoint: Viewpoint): LiftGoldStandardTemplate {
    const shared = {
        viewpoint,
        barPathDriftTolerance: 0.08,
        velocityLossTolerance: 0.28,
        symmetryTolerance: 12,
    };

    if (lift === 'squat') {
        return {
            ...shared,
            lift,
            corridors: {
                bottom: {
                    leftKneeAngle: { min: 55, max: 105 },
                    rightKneeAngle: { min: 55, max: 105 },
                    leftHipAngle: { min: 45, max: 95 },
                    rightHipAngle: { min: 45, max: 95 },
                    torsoAngle: { min: 35, max: 85 },
                },
                lockout: {
                    leftKneeAngle: { min: 160, max: 180 },
                    rightKneeAngle: { min: 160, max: 180 },
                    leftHipAngle: { min: 155, max: 180 },
                    rightHipAngle: { min: 155, max: 180 },
                },
            },
        };
    }

    if (lift === 'bench') {
        return {
            ...shared,
            lift,
            barPathDriftTolerance: 0.1,
            corridors: {
                bottom: {
                    leftElbowAngle: { min: 55, max: 95 },
                    rightElbowAngle: { min: 55, max: 95 },
                },
                lockout: {
                    leftElbowAngle: { min: 155, max: 180 },
                    rightElbowAngle: { min: 155, max: 180 },
                },
            },
        };
    }

    if (lift === 'deadlift') {
        return {
            ...shared,
            lift,
            corridors: {
                setup: {
                    leftHipAngle: { min: 45, max: 100 },
                    rightHipAngle: { min: 45, max: 100 },
                    spineInclination: { min: 15, max: 55 },
                },
                lockout: {
                    leftHipAngle: { min: 160, max: 180 },
                    rightHipAngle: { min: 160, max: 180 },
                    spineInclination: { min: 75, max: 105 },
                },
            },
        };
    }

    return {
        ...shared,
        lift,
        corridors: {
            setup: {
                leftElbowAngle: { min: 55, max: 95 },
                rightElbowAngle: { min: 55, max: 95 },
            },
            lockout: {
                leftElbowAngle: { min: 160, max: 180 },
                rightElbowAngle: { min: 160, max: 180 },
                spineInclination: { min: 80, max: 105 },
            },
        },
    };
}

export function deriveJointAngles(frame: PoseFrame): JointAngleSnapshot {
    const leftShoulder = getPoint(frame, 'left_shoulder');
    const rightShoulder = getPoint(frame, 'right_shoulder');
    const leftElbow = getPoint(frame, 'left_elbow');
    const rightElbow = getPoint(frame, 'right_elbow');
    const leftWrist = getPoint(frame, 'left_wrist');
    const rightWrist = getPoint(frame, 'right_wrist');
    const leftHip = getPoint(frame, 'left_hip');
    const rightHip = getPoint(frame, 'right_hip');
    const leftKnee = getPoint(frame, 'left_knee');
    const rightKnee = getPoint(frame, 'right_knee');
    const leftAnkle = getPoint(frame, 'left_ankle');
    const rightAnkle = getPoint(frame, 'right_ankle');

    const shoulderMid = midpoint(leftShoulder, rightShoulder);
    const hipMid = midpoint(leftHip, rightHip);

    return {
        leftKneeAngle: leftHip && leftKnee && leftAnkle ? vectorAngle(leftHip, leftKnee, leftAnkle) : undefined,
        rightKneeAngle: rightHip && rightKnee && rightAnkle ? vectorAngle(rightHip, rightKnee, rightAnkle) : undefined,
        leftHipAngle: leftShoulder && leftHip && leftKnee ? vectorAngle(leftShoulder, leftHip, leftKnee) : undefined,
        rightHipAngle: rightShoulder && rightHip && rightKnee ? vectorAngle(rightShoulder, rightHip, rightKnee) : undefined,
        leftElbowAngle: leftShoulder && leftElbow && leftWrist ? vectorAngle(leftShoulder, leftElbow, leftWrist) : undefined,
        rightElbowAngle: rightShoulder && rightElbow && rightWrist ? vectorAngle(rightShoulder, rightElbow, rightWrist) : undefined,
        torsoAngle: shoulderMid && hipMid ? lineAngleDegrees(hipMid, shoulderMid) : undefined,
        spineInclination: shoulderMid && hipMid ? 180 - lineAngleDegrees(hipMid, shoulderMid) : undefined,
    };
}

export function estimateBarPath(frame: PoseFrame, viewpoint: Viewpoint): BarPathSnapshot {
    const primary = getPrimarySide(viewpoint);
    const wrist = getPoint(frame, primary === 'left' ? 'left_wrist' : 'right_wrist');
    const secondaryWrist = getPoint(frame, primary === 'left' ? 'right_wrist' : 'left_wrist');
    const proxy = midpoint(wrist, secondaryWrist) ?? wrist ?? secondaryWrist;

    return {
        x: proxy?.x ?? 0,
        y: proxy?.y ?? 0,
        velocity: 0,
    };
}

export function normalizePoseFrames(frames: PoseFrame[]): PoseFrame[] {
    return frames.map((frame) => {
        const leftHip = getPoint(frame, 'left_hip');
        const rightHip = getPoint(frame, 'right_hip');
        const hipMid = midpoint(leftHip, rightHip);
        const leftShoulder = getPoint(frame, 'left_shoulder');
        const rightShoulder = getPoint(frame, 'right_shoulder');
        const shoulderMid = midpoint(leftShoulder, rightShoulder);

        if (!hipMid || !shoulderMid) return frame;

        const scale = Math.max(0.0001, Math.abs(shoulderMid.y - hipMid.y));
        const normalizedLandmarks = Object.fromEntries(
            Object.entries(frame.landmarks).map(([name, landmark]) => {
                if (!landmark) return [name, landmark];
                return [name, {
                    ...landmark,
                    x: (landmark.x - hipMid.x) / scale,
                    y: (landmark.y - hipMid.y) / scale,
                }];
            })
        ) as Partial<Record<LandmarkName, PoseLandmark>>;

        return {
            ...frame,
            landmarks: normalizedLandmarks,
        };
    });
}

export function detectRepPhases(
    frames: FrameKinematicSnapshot[],
    lift: LiftType
): RepPhaseWindow[] {
    if (frames.length === 0) return [];

    const metricSeries = frames.map((frame) => {
        if (lift === 'bench' || lift === 'overhead_press') {
            return average([frame.angles.leftElbowAngle ?? 0, frame.angles.rightElbowAngle ?? 0]);
        }
        return average([frame.angles.leftHipAngle ?? 0, frame.angles.rightHipAngle ?? 0]);
    });

    const minValue = Math.min(...metricSeries);
    const maxValue = Math.max(...metricSeries);
    const bottomIndex = metricSeries.indexOf(minValue);
    const startIndex = 0;
    const endIndex = metricSeries.length - 1;
    const lockoutThreshold = maxValue - (maxValue - minValue) * 0.1;
    const lockoutIndex = metricSeries.findIndex((value, index) => index > bottomIndex && value >= lockoutThreshold);

    return [
        { phase: 'setup', startFrame: startIndex, endFrame: Math.max(startIndex, Math.floor(bottomIndex * 0.25)) },
        { phase: 'eccentric', startFrame: Math.max(startIndex, Math.floor(bottomIndex * 0.25)), endFrame: Math.max(startIndex, bottomIndex - 1) },
        { phase: 'bottom', startFrame: bottomIndex, endFrame: bottomIndex },
        {
            phase: 'concentric',
            startFrame: Math.min(endIndex, bottomIndex + 1),
            endFrame: lockoutIndex > 0 ? lockoutIndex : endIndex,
        },
        {
            phase: 'lockout',
            startFrame: lockoutIndex > 0 ? lockoutIndex : endIndex,
            endFrame: endIndex,
        },
    ];
}

function getPhaseFrame(frames: FrameKinematicSnapshot[], phase: RepPhaseWindow) {
    const slice = frames.slice(phase.startFrame, phase.endFrame + 1);
    if (slice.length === 0) return undefined;
    return slice[Math.floor(slice.length / 2)];
}

function severityForDeviation(magnitude: number) {
    if (magnitude >= 18) return 'major' as const;
    if (magnitude >= 8) return 'moderate' as const;
    return 'minor' as const;
}

export function analyzeRepAgainstTemplate(
    frames: PoseFrame[],
    lift: LiftType,
    viewpoint: Viewpoint,
    repIndex = 0
): RepAnalysis {
    const normalized = normalizePoseFrames(frames);
    const kinematics = normalized.map((frame, index, allFrames) => {
        const barPath = estimateBarPath(frame, viewpoint);
        const previous = index > 0 ? estimateBarPath(allFrames[index - 1], viewpoint) : barPath;
        const dt = index > 0 ? Math.max(1, frame.timestampMs - allFrames[index - 1].timestampMs) : 1;

        return {
            frameIndex: index,
            timestampMs: frame.timestampMs,
            confidence: frameConfidence(frame),
            angles: deriveJointAngles(frame),
            barPath: {
                ...barPath,
                velocity: Math.sqrt(((barPath.x - previous.x) ** 2) + ((barPath.y - previous.y) ** 2)) / dt,
            },
        };
    });

    const phases = detectRepPhases(kinematics, lift);
    const template = getDefaultGoldStandardTemplate(lift, viewpoint);
    const deviations: RepAnalysis['deviations'] = [];

    phases.forEach((phaseWindow) => {
        const phaseCorridors = template.corridors[phaseWindow.phase];
        const phaseFrame = getPhaseFrame(kinematics, phaseWindow);
        if (!phaseCorridors || !phaseFrame) return;

        Object.entries(phaseCorridors).forEach(([metricName, corridor]) => {
            const key = metricName as keyof JointAngleSnapshot;
            const value = phaseFrame.angles[key];
            if (value == null || !corridor) return;
            const magnitude =
                value < corridor.min ? corridor.min - value
                    : value > corridor.max ? value - corridor.max
                        : 0;
            if (magnitude <= 0) return;
            deviations.push({
                metric: key,
                phase: phaseWindow.phase,
                magnitude: Number(magnitude.toFixed(1)),
                severity: severityForDeviation(magnitude),
                detail: `${key} drifted outside the accepted ${phaseWindow.phase} corridor by ${magnitude.toFixed(1)} degrees.`,
            });
        });
    });

    const barXs = kinematics.map((frame) => frame.barPath.x);
    const barPathDrift = Number((Math.max(...barXs) - Math.min(...barXs)).toFixed(3));
    const velocities = kinematics.map((frame) => frame.barPath.velocity).filter((value) => value > 0);
    const maxVelocity = Math.max(0, ...velocities);
    const minPositiveVelocity = velocities.length > 0 ? Math.min(...velocities) : 0;
    const maxVelocityLoss = maxVelocity > 0 ? Number((1 - (minPositiveVelocity / maxVelocity)).toFixed(2)) : 0;

    const leftKnees = kinematics.map((frame) => frame.angles.leftKneeAngle).filter((value): value is number => value != null);
    const rightKnees = kinematics.map((frame) => frame.angles.rightKneeAngle).filter((value): value is number => value != null);
    const symmetryDelta = Number(Math.abs(average(leftKnees) - average(rightKnees)).toFixed(1));

    if (barPathDrift > template.barPathDriftTolerance) {
        deviations.push({
            metric: 'bar_path',
            phase: 'concentric',
            magnitude: Number((barPathDrift * 100).toFixed(1)),
            severity: severityForDeviation(barPathDrift * 100),
            detail: 'The bar path drifted away from the efficient vertical corridor.',
        });
    }

    return {
        repIndex,
        phases,
        frames: kinematics,
        confidence: Number(average(kinematics.map((frame) => frame.confidence)).toFixed(2)),
        deviations,
        summary: {
            barPathDrift,
            maxVelocityLoss,
            symmetryDelta,
        },
    };
}
