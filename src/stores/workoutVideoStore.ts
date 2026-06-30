import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';

export type WorkoutVideoExercise = 'pushups' | 'squats' | 'lunges' | 'plank' | 'burpees';

export interface WorkoutVideoMetric {
    key: 'range' | 'tempo' | 'stability';
    label: string;
    score: number;
}

export interface WorkoutVideoAssessment {
    id: string;
    exercise: WorkoutVideoExercise;
    uri: string;
    createdAt: string;
    score: number;
    baselineScore: number;
    deltaFromBaseline: number;
    durationSec: number;
    repCount: number;
    metrics: WorkoutVideoMetric[];
    improvementAreas: string[];
    savedToLibrary: boolean;
}

interface WorkoutVideoState {
    assessments: WorkoutVideoAssessment[];
    addAssessment: (assessment: WorkoutVideoAssessment) => void;
    getBaselineScore: (exercise: WorkoutVideoExercise) => number | null;
    markSavedToLibrary: (id: string) => void;
    reset: () => void;
}

export const useWorkoutVideoStore = create<WorkoutVideoState>()(
    persist((set, get) => ({
        assessments: [],

        addAssessment: (assessment) => {
            set((state) => ({
                assessments: [assessment, ...state.assessments].slice(0, 120),
            }));
        },

        getBaselineScore: (exercise) => {
            const matches = get().assessments
                .filter((item) => item.exercise === exercise)
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

            return matches.length > 0 ? matches[0].score : null;
        },

        markSavedToLibrary: (id) => {
            set((state) => ({
                assessments: state.assessments.map((entry) => (
                    entry.id === id
                        ? { ...entry, savedToLibrary: true }
                        : entry
                )),
            }));
        },
        reset: () => set({ assessments: [] }),
    }), {
        name: 'jfit-workout-video-assessments',
        storage: createJSONStorage(() => appStorage),
    }),
);
