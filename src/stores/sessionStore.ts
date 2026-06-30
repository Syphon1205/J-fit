import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';
import { Workout, WorkoutLog } from './workoutStore';
import {
    ActiveWorkoutSession,
    createWorkoutSession,
    logCompletedSet,
    pauseSession,
    resumeSession,
    SetPerformanceInput,
    skipRest,
    startRest,
    tickSession,
} from '../modules/session/workoutSessionManager';

interface SessionState {
    activeSession: ActiveWorkoutSession | null;
    lastCompletedSessionId: string | null;
    startSession: (workout: Workout) => void;
    tick: (deltaSeconds?: number) => void;
    pause: () => void;
    resume: () => void;
    beginRest: (seconds: number) => void;
    skipRest: () => void;
    logSet: (workout: Workout, input: SetPerformanceInput) => { completed: boolean };
    completeSession: (workout: Workout) => WorkoutLog | null;
    abandonSession: () => void;
    reset: () => void;
}

export const useSessionStore = create<SessionState>()(
    persist((set, get) => ({
        activeSession: null,
        lastCompletedSessionId: null,

        startSession: (workout) => {
            set({ activeSession: createWorkoutSession(workout) });
        },

        tick: (deltaSeconds = 1) => {
            const session = get().activeSession;
            if (!session) return;
            set({ activeSession: tickSession(session, deltaSeconds) });
        },

        pause: () => {
            const session = get().activeSession;
            if (!session) return;
            set({ activeSession: pauseSession(session) });
        },

        resume: () => {
            const session = get().activeSession;
            if (!session) return;
            set({ activeSession: resumeSession(session) });
        },

        beginRest: (seconds) => {
            const session = get().activeSession;
            if (!session) return;
            set({ activeSession: startRest(session, seconds) });
        },

        skipRest: () => {
            const session = get().activeSession;
            if (!session) return;
            set({ activeSession: skipRest(session) });
        },

        logSet: (workout, input) => {
            const session = get().activeSession;
            if (!session) return { completed: false };
            const result = logCompletedSet(session, workout, input);
            set({ activeSession: result.session });
            return { completed: result.completed };
        },

        completeSession: (workout) => {
            const session = get().activeSession;
            if (!session) return null;

            const log: WorkoutLog = {
                id: `l${Date.now()}`,
                workoutId: workout.id,
                workoutName: workout.name,
                date: new Date().toISOString().split('T')[0],
                duration: Math.max(1, Math.round(session.elapsedSeconds / 60)),
                caloriesBurned: workout.calories,
                completed: true,
            };

            set({
                activeSession: null,
                lastCompletedSessionId: session.id,
            });

            return log;
        },

        abandonSession: () => {
            set({ activeSession: null });
        },
        reset: () => set({ activeSession: null, lastCompletedSessionId: null }),
    }), {
        name: 'jfit-session',
        storage: createJSONStorage(() => appStorage),
        partialize: (state) => ({
            activeSession: state.activeSession,
            lastCompletedSessionId: state.lastCompletedSessionId,
        }),
    })
);
