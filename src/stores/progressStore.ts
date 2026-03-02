import { create } from 'zustand';

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
    addWeight: (entry: WeightEntry) => void;
    addMeasurement: (entry: MeasurementEntry) => void;
    reset: () => void;
}

const sampleWeightHistory: WeightEntry[] = [
    { date: '2026-01-05', value: 80.2 },
    { date: '2026-01-12', value: 79.5 },
    { date: '2026-01-19', value: 79.8 },
    { date: '2026-01-26', value: 79.1 },
    { date: '2026-02-02', value: 78.6 },
    { date: '2026-02-09', value: 78.2 },
    { date: '2026-02-16', value: 77.5 },
    { date: '2026-02-23', value: 77.1 },
    { date: '2026-03-02', value: 76.4 },
];

const samplePRs: PersonalRecord[] = [
    { exercise: 'Bench Press', value: '100kg', date: '2026-02-20', previousValue: '95kg' },
    { exercise: 'Squat', value: '140kg', date: '2026-02-15', previousValue: '130kg' },
    { exercise: 'Deadlift', value: '160kg', date: '2026-02-22', previousValue: '150kg' },
    { exercise: '5K Run', value: '22:30', date: '2026-02-18', previousValue: '24:15' },
];

export const useProgressStore = create<ProgressState>((set) => ({
    weightHistory: sampleWeightHistory,
    measurements: [
        { date: '2026-02-01', chest: 102, waist: 82, hips: 98, arms: 36, thighs: 58 },
        { date: '2026-03-01', chest: 104, waist: 80, hips: 97, arms: 37, thighs: 59 },
    ],
    personalRecords: samplePRs,
    weeklyCalories: [2450, 2680, 2320, 2550, 2790, 2410, 2600],
    weeklySteps: [8500, 12300, 9800, 11200, 7600, 15400, 10100],
    weeklyWorkoutMinutes: [55, 50, 60, 25, 55, 30, 0],

    addWeight: (entry) =>
        set((state) => ({
            weightHistory: [...state.weightHistory, entry],
        })),

    addMeasurement: (entry) =>
        set((state) => ({
            measurements: [...state.measurements, entry],
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
}));
