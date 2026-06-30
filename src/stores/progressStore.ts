import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';

export interface WeightEntry {
    date: string;
    value: number;
}

export interface MeasurementEntry {
    date: string;
    chest: number;
    waist: number;
    hips: number;
    arms: number;
    thighs: number;
}

export interface PersonalRecord {
    exercise: string;
    value: string;
    date: string;
    previousValue?: string;
}

interface ProgressState {
    weightHistory: WeightEntry[];
    measurements: MeasurementEntry[];
    personalRecords: PersonalRecord[];
    weeklyCalories: number[];
    weeklySteps: number[];
    weeklyWorkoutMinutes: number[];
    setWeeklySteps: (steps: number[]) => void;
    setWeeklyCalories: (calories: number[]) => void;
    setWeeklyWorkoutMinutes: (minutes: number[]) => void;
    addWeight: (entry: WeightEntry) => void;
    addMeasurement: (entry: MeasurementEntry) => void;
    addPersonalRecord: (record: PersonalRecord) => void;
    reset: () => void;
}

const sampleWeightHistory: WeightEntry[] = [];

const samplePRs: PersonalRecord[] = [];

export const useProgressStore = create<ProgressState>()(persist((set) => ({
    weightHistory: sampleWeightHistory,
    measurements: [],
    personalRecords: samplePRs,
    weeklyCalories: [0, 0, 0, 0, 0, 0, 0],
    weeklySteps: [0, 0, 0, 0, 0, 0, 0],
    weeklyWorkoutMinutes: [0, 0, 0, 0, 0, 0, 0],

    setWeeklySteps: (steps) =>
        set(() => ({
            weeklySteps: steps.slice(0, 7),
        })),

    setWeeklyCalories: (calories) =>
        set(() => ({
            weeklyCalories: calories.slice(0, 7),
        })),

    setWeeklyWorkoutMinutes: (minutes) =>
        set(() => ({
            weeklyWorkoutMinutes: minutes.slice(0, 7),
        })),

    addWeight: (entry) =>
        set((state) => ({
            weightHistory: [...state.weightHistory, entry],
        })),

    addMeasurement: (entry) =>
        set((state) => ({
            measurements: [...state.measurements, entry],
        })),

    addPersonalRecord: (record) =>
        set((state) => ({
            personalRecords: [record, ...state.personalRecords],
        })),

    reset: () =>
        set({
            weightHistory: [],
            measurements: [],
            personalRecords: [],
            weeklyCalories: [0, 0, 0, 0, 0, 0, 0],
            weeklySteps: [0, 0, 0, 0, 0, 0, 0],
            weeklyWorkoutMinutes: [0, 0, 0, 0, 0, 0, 0],
        }),
}), {
    name: 'jfit-progress',
    storage: createJSONStorage(() => appStorage),
    partialize: (state) => ({
        weightHistory: state.weightHistory,
        measurements: state.measurements,
        personalRecords: state.personalRecords,
        weeklyCalories: state.weeklyCalories,
        weeklySteps: state.weeklySteps,
        weeklyWorkoutMinutes: state.weeklyWorkoutMinutes,
    }),
}));
