import { Workout } from '../../stores/workoutStore';

export type SessionStatus = 'idle' | 'active' | 'rest' | 'paused' | 'completed';

export interface SetPerformanceInput {
    repsCompleted: number;
    weightKg?: number;
    rpe?: number;
    notes?: string;
}

export interface LoggedSet {
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    repsTarget: string;
    repsCompleted: number;
    weightKg?: number;
    rpe?: number;
    notes?: string;
    loggedAt: string;
}

export interface ActiveWorkoutSession {
    id: string;
    workoutId: string;
    workoutName: string;
    status: SessionStatus;
    startedAt: string;
    updatedAt: string;
    elapsedSeconds: number;
    currentExerciseIndex: number;
    currentSetNumber: number;
    restRemainingSeconds: number;
    completedExerciseIds: string[];
    loggedSets: LoggedSet[];
}

export interface SessionTransitionResult {
    session: ActiveWorkoutSession;
    completed: boolean;
}

const nowIso = () => new Date().toISOString();

export function createWorkoutSession(workout: Workout): ActiveWorkoutSession {
    return {
        id: `session_${Date.now()}`,
        workoutId: workout.id,
        workoutName: workout.name,
        status: 'active',
        startedAt: nowIso(),
        updatedAt: nowIso(),
        elapsedSeconds: 0,
        currentExerciseIndex: 0,
        currentSetNumber: 1,
        restRemainingSeconds: 0,
        completedExerciseIds: [],
        loggedSets: [],
    };
}

export function tickSession(
    session: ActiveWorkoutSession,
    deltaSeconds = 1
): ActiveWorkoutSession {
    const elapsedSeconds = session.status === 'paused' ? session.elapsedSeconds : session.elapsedSeconds + deltaSeconds;
    const restRemainingSeconds =
        session.status === 'rest'
            ? Math.max(0, session.restRemainingSeconds - deltaSeconds)
            : session.restRemainingSeconds;

    return {
        ...session,
        elapsedSeconds,
        restRemainingSeconds,
        status: session.status === 'rest' && restRemainingSeconds === 0 ? 'active' : session.status,
        updatedAt: nowIso(),
    };
}

export function pauseSession(session: ActiveWorkoutSession): ActiveWorkoutSession {
    return { ...session, status: 'paused', updatedAt: nowIso() };
}

export function resumeSession(session: ActiveWorkoutSession): ActiveWorkoutSession {
    return {
        ...session,
        status: session.restRemainingSeconds > 0 ? 'rest' : 'active',
        updatedAt: nowIso(),
    };
}

export function startRest(session: ActiveWorkoutSession, seconds: number): ActiveWorkoutSession {
    return {
        ...session,
        status: seconds > 0 ? 'rest' : 'active',
        restRemainingSeconds: Math.max(0, Math.floor(seconds)),
        updatedAt: nowIso(),
    };
}

export function skipRest(session: ActiveWorkoutSession): ActiveWorkoutSession {
    return {
        ...session,
        status: 'active',
        restRemainingSeconds: 0,
        updatedAt: nowIso(),
    };
}

export function logCompletedSet(
    session: ActiveWorkoutSession,
    workout: Workout,
    input: SetPerformanceInput
): SessionTransitionResult {
    const exercise = workout.exercises[session.currentExerciseIndex];
    if (!exercise) {
        return { session: { ...session, status: 'completed', updatedAt: nowIso() }, completed: true };
    }

    const loggedSet: LoggedSet = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        setNumber: session.currentSetNumber,
        repsTarget: exercise.reps,
        repsCompleted: input.repsCompleted,
        weightKg: input.weightKg,
        rpe: input.rpe,
        notes: input.notes,
        loggedAt: nowIso(),
    };

    const nextSetNumber = session.currentSetNumber + 1;
    const exerciseFinished = nextSetNumber > Math.max(1, exercise.sets);
    const currentExerciseIndex = exerciseFinished ? session.currentExerciseIndex + 1 : session.currentExerciseIndex;
    const currentSetNumber = exerciseFinished ? 1 : nextSetNumber;
    const completedExerciseIds = exerciseFinished
        ? [...session.completedExerciseIds, exercise.id]
        : session.completedExerciseIds;
    const completed = currentExerciseIndex >= workout.exercises.length;

    return {
        completed,
        session: {
            ...session,
            status: completed ? 'completed' : 'active',
            currentExerciseIndex,
            currentSetNumber,
            completedExerciseIds,
            loggedSets: [...session.loggedSets, loggedSet],
            updatedAt: nowIso(),
        },
    };
}
