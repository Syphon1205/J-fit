import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';

export interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps: string;
    weight?: string;
    duration?: number; // seconds
    restTime: number; // seconds
    completed?: boolean;
}

export interface Workout {
    id: string;
    name: string;
    category: 'strength' | 'cardio' | 'hiit' | 'yoga' | 'flexibility';
    duration: number; // minutes
    calories: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    exercises: Exercise[];
    color: string;
    icon: string;
}

export interface WorkoutLog {
    id: string;
    workoutId: string;
    workoutName: string;
    date: string;
    duration: number;
    caloriesBurned: number;
    completed: boolean;
    completedSets?: number;
    volumeKg?: number;
}

interface TimerState {
    isRunning: boolean;
    currentTime: number;
    totalTime: number;
    isRest: boolean;
    currentExerciseIndex: number;
}

interface WorkoutState {
    workouts: Workout[];
    workoutLogs: WorkoutLog[];
    activeWorkout: Workout | null;
    timer: TimerState;
    weeklySchedule: Record<string, string>;
    startWorkout: (workout: Workout) => void;
    completeExercise: (index: number) => void;
    endWorkout: (elapsedSeconds?: number) => void;
    logWorkout: (log: WorkoutLog) => void;
    reset: () => void;
}

const sampleWorkouts: Workout[] = [
    {
        id: '1',
        name: 'Push Day',
        category: 'strength',
        duration: 55,
        calories: 420,
        difficulty: 'intermediate',
        color: '#FF6B9D',
        icon: 'fitness',
        exercises: [
            { id: 'e1', name: 'Bench Press', sets: 4, reps: '8-10', weight: '80kg', restTime: 90 },
            { id: 'e2', name: 'Overhead Press', sets: 3, reps: '8-10', weight: '45kg', restTime: 90 },
            { id: 'e3', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: '30kg', restTime: 60 },
            { id: 'e4', name: 'Cable Flyes', sets: 3, reps: '12-15', weight: '15kg', restTime: 60 },
            { id: 'e5', name: 'Tricep Pushdowns', sets: 3, reps: '12-15', weight: '25kg', restTime: 60 },
            { id: 'e6', name: 'Lateral Raises', sets: 4, reps: '15', weight: '10kg', restTime: 45 },
        ],
    },
    {
        id: '2',
        name: 'Pull Day',
        category: 'strength',
        duration: 50,
        calories: 380,
        difficulty: 'intermediate',
        color: '#A78BFA',
        icon: 'body',
        exercises: [
            { id: 'e7', name: 'Deadlift', sets: 4, reps: '5', weight: '120kg', restTime: 120 },
            { id: 'e8', name: 'Barbell Row', sets: 4, reps: '8-10', weight: '70kg', restTime: 90 },
            { id: 'e9', name: 'Pull-ups', sets: 3, reps: '8-10', weight: 'BW', restTime: 90 },
            { id: 'e10', name: 'Face Pulls', sets: 3, reps: '15', weight: '15kg', restTime: 60 },
            { id: 'e11', name: 'Dumbbell Curls', sets: 3, reps: '10-12', weight: '14kg', restTime: 60 },
            { id: 'e12', name: 'Hammer Curls', sets: 3, reps: '10-12', weight: '12kg', restTime: 60 },
        ],
    },
    {
        id: '3',
        name: 'Leg Day',
        category: 'strength',
        duration: 60,
        calories: 520,
        difficulty: 'advanced',
        color: '#00E5C7',
        icon: 'walk',
        exercises: [
            { id: 'e13', name: 'Barbell Squat', sets: 5, reps: '5', weight: '110kg', restTime: 120 },
            { id: 'e14', name: 'Romanian Deadlift', sets: 4, reps: '8-10', weight: '90kg', restTime: 90 },
            { id: 'e15', name: 'Leg Press', sets: 4, reps: '10-12', weight: '180kg', restTime: 90 },
            { id: 'e16', name: 'Walking Lunges', sets: 3, reps: '12 each', weight: '20kg', restTime: 60 },
            { id: 'e17', name: 'Calf Raises', sets: 4, reps: '15', weight: '60kg', restTime: 45 },
            { id: 'e18', name: 'Leg Curls', sets: 3, reps: '12', weight: '40kg', restTime: 60 },
        ],
    },
    {
        id: '4',
        name: 'HIIT Cardio',
        category: 'hiit',
        duration: 25,
        calories: 350,
        difficulty: 'intermediate',
        color: '#F59E0B',
        icon: 'flash',
        exercises: [
            { id: 'e19', name: 'Burpees', sets: 4, reps: '30s', duration: 30, restTime: 15 },
            { id: 'e20', name: 'Mountain Climbers', sets: 4, reps: '30s', duration: 30, restTime: 15 },
            { id: 'e21', name: 'Jump Squats', sets: 4, reps: '30s', duration: 30, restTime: 15 },
            { id: 'e22', name: 'High Knees', sets: 4, reps: '30s', duration: 30, restTime: 15 },
            { id: 'e23', name: 'Box Jumps', sets: 4, reps: '30s', duration: 30, restTime: 15 },
        ],
    },
    {
        id: '5',
        name: 'Morning Yoga',
        category: 'yoga',
        duration: 30,
        calories: 150,
        difficulty: 'beginner',
        color: '#3B82F6',
        icon: 'leaf',
        exercises: [
            { id: 'e24', name: 'Sun Salutation', sets: 3, reps: '5 breaths', duration: 60, restTime: 10 },
            { id: 'e25', name: 'Warrior I', sets: 2, reps: '30s each', duration: 30, restTime: 10 },
            { id: 'e26', name: 'Warrior II', sets: 2, reps: '30s each', duration: 30, restTime: 10 },
            { id: 'e27', name: 'Downward Dog', sets: 3, reps: '45s', duration: 45, restTime: 10 },
            { id: 'e28', name: "Child's Pose", sets: 2, reps: '60s', duration: 60, restTime: 10 },
        ],
    },
    {
        id: '6',
        name: 'Core Blast',
        category: 'strength',
        duration: 20,
        calories: 200,
        difficulty: 'beginner',
        color: '#EF4444',
        icon: 'flame',
        exercises: [
            { id: 'e29', name: 'Plank', sets: 3, reps: '45s', duration: 45, restTime: 30 },
            { id: 'e30', name: 'Russian Twists', sets: 3, reps: '20', weight: '8kg', restTime: 30 },
            { id: 'e31', name: 'Bicycle Crunches', sets: 3, reps: '20', restTime: 30 },
            { id: 'e32', name: 'Leg Raises', sets: 3, reps: '15', restTime: 30 },
            { id: 'e33', name: 'Dead Bug', sets: 3, reps: '10 each', restTime: 30 },
        ],
    },
    {
        id: '7',
        name: 'Full Body Power',
        category: 'strength',
        duration: 65,
        calories: 580,
        difficulty: 'advanced',
        color: '#F97316',
        icon: 'barbell',
        exercises: [
            { id: 'n1', name: 'Power Clean', sets: 5, reps: '3', weight: '70kg', restTime: 120 },
            { id: 'n2', name: 'Front Squat', sets: 4, reps: '5', weight: '85kg', restTime: 120 },
            { id: 'n3', name: 'Weighted Pull-ups', sets: 4, reps: '6', weight: '+15kg', restTime: 90 },
            { id: 'n4', name: 'Dumbbell Row', sets: 3, reps: '10 each', weight: '32kg', restTime: 60 },
            { id: 'n5', name: 'Romanian Deadlift', sets: 3, reps: '10', weight: '85kg', restTime: 90 },
            { id: 'n6', name: 'Farmers Carry', sets: 3, reps: '40m', weight: '32kg each', restTime: 60 },
            { id: 'n7', name: 'Ab Wheel Rollout', sets: 3, reps: '12', restTime: 45 },
        ],
    },
    {
        id: '8',
        name: 'Upper Body',
        category: 'strength',
        duration: 45,
        calories: 340,
        difficulty: 'beginner',
        color: '#06B6D4',
        icon: 'fitness',
        exercises: [
            { id: 'n8', name: 'Push-ups', sets: 4, reps: '15', restTime: 60 },
            { id: 'n9', name: 'Dumbbell Shoulder Press', sets: 3, reps: '12', weight: '14kg', restTime: 60 },
            { id: 'n10', name: 'Dumbbell Row', sets: 3, reps: '12 each', weight: '16kg', restTime: 60 },
            { id: 'n11', name: 'Tricep Dips', sets: 3, reps: '12', restTime: 45 },
            { id: 'n12', name: 'Incline Curl', sets: 3, reps: '12', weight: '10kg', restTime: 45 },
            { id: 'n13', name: 'Face Pulls', sets: 3, reps: '15', weight: '12kg', restTime: 45 },
        ],
    },
    {
        id: '9',
        name: 'Sprint Intervals',
        category: 'hiit',
        duration: 30,
        calories: 420,
        difficulty: 'advanced',
        color: '#EC4899',
        icon: 'flash',
        exercises: [
            { id: 'n14', name: '400m Sprint', sets: 6, reps: '1', duration: 80, restTime: 90 },
            { id: 'n15', name: 'Walking Recovery', sets: 6, reps: '90s', duration: 90, restTime: 0 },
            { id: 'n16', name: 'Plyometric Lunges', sets: 3, reps: '10 each', restTime: 45 },
            { id: 'n17', name: 'Agility Ladder', sets: 4, reps: '20s', duration: 20, restTime: 20 },
        ],
    },
    {
        id: '10',
        name: 'Mobility Flow',
        category: 'flexibility',
        duration: 40,
        calories: 120,
        difficulty: 'beginner',
        color: '#8B5CF6',
        icon: 'body',
        exercises: [
            { id: 'n18', name: 'Hip 90/90 Stretch', sets: 2, reps: '60s each', duration: 60, restTime: 15 },
            { id: 'n19', name: 'Thoracic Rotation', sets: 3, reps: '10 each', restTime: 15 },
            { id: 'n20', name: 'Couch Stretch', sets: 2, reps: '45s each', duration: 45, restTime: 15 },
            { id: 'n21', name: 'World Greatest Stretch', sets: 3, reps: '5 each', restTime: 15 },
            { id: 'n22', name: 'Pigeon Pose', sets: 2, reps: '60s each', duration: 60, restTime: 15 },
            { id: 'n23', name: 'Shoulder Dislocates', sets: 3, reps: '10', restTime: 15 },
        ],
    },
    {
        id: '11',
        name: 'Kettlebell Circuit',
        category: 'hiit',
        duration: 35,
        calories: 380,
        difficulty: 'intermediate',
        color: '#10B981',
        icon: 'ellipse',
        exercises: [
            { id: 'n24', name: 'KB Swing', sets: 5, reps: '20', weight: '24kg', restTime: 30 },
            { id: 'n25', name: 'KB Clean & Press', sets: 4, reps: '8 each', weight: '20kg', restTime: 45 },
            { id: 'n26', name: 'KB Goblet Squat', sets: 4, reps: '12', weight: '28kg', restTime: 45 },
            { id: 'n27', name: 'KB Renegade Row', sets: 3, reps: '8 each', weight: '16kg', restTime: 60 },
            { id: 'n28', name: 'KB Turkish Get-up', sets: 2, reps: '3 each', weight: '16kg', restTime: 60 },
            { id: 'n29', name: 'KB Suitcase Carry', sets: 3, reps: '40m each', weight: '24kg', restTime: 45 },
        ],
    },
    {
        id: '12',
        name: 'Arms & Shoulders',
        category: 'strength',
        duration: 40,
        calories: 280,
        difficulty: 'intermediate',
        color: '#F43F5E',
        icon: 'barbell',
        exercises: [
            { id: 'n30', name: 'Barbell Curl', sets: 4, reps: '10', weight: '40kg', restTime: 60 },
            { id: 'n31', name: 'Skull Crushers', sets: 4, reps: '10', weight: '30kg', restTime: 60 },
            { id: 'n32', name: 'Arnold Press', sets: 3, reps: '12', weight: '16kg', restTime: 60 },
            { id: 'n33', name: 'Cable Curl', sets: 3, reps: '15', weight: '20kg', restTime: 45 },
            { id: 'n34', name: 'Overhead Tricep Ext.', sets: 3, reps: '12', weight: '20kg', restTime: 45 },
            { id: 'n35', name: 'Front Raises', sets: 3, reps: '15', weight: '8kg', restTime: 45 },
            { id: 'n36', name: 'Reverse Curl', sets: 3, reps: '12', weight: '20kg', restTime: 45 },
        ],
    },
    {
        id: '13',
        name: '5K Run Prep',
        category: 'cardio',
        duration: 45,
        calories: 460,
        difficulty: 'intermediate',
        color: '#22D3EE',
        icon: 'walk',
        exercises: [
            { id: 'n37', name: 'Warm-up Jog', sets: 1, reps: '5 min', duration: 300, restTime: 0 },
            { id: 'n38', name: 'Tempo Run', sets: 1, reps: '20 min', duration: 1200, restTime: 0 },
            { id: 'n39', name: 'Recovery Walk', sets: 1, reps: '3 min', duration: 180, restTime: 0 },
            { id: 'n40', name: 'Strides', sets: 4, reps: '100m', duration: 20, restTime: 60 },
            { id: 'n41', name: 'Cool-down Walk', sets: 1, reps: '5 min', duration: 300, restTime: 0 },
        ],
    },
    {
        id: '14',
        name: 'Olympic Lifting',
        category: 'strength',
        duration: 70,
        calories: 500,
        difficulty: 'advanced',
        color: '#FBBF24',
        icon: 'barbell',
        exercises: [
            { id: 'n42', name: 'Snatch', sets: 6, reps: '2', weight: '65kg', restTime: 180 },
            { id: 'n43', name: 'Clean & Jerk', sets: 5, reps: '2', weight: '85kg', restTime: 180 },
            { id: 'n44', name: 'Hang Power Clean', sets: 4, reps: '3', weight: '75kg', restTime: 120 },
            { id: 'n45', name: 'Snatch Pull', sets: 4, reps: '4', weight: '80kg', restTime: 90 },
            { id: 'n46', name: 'Front Squat', sets: 3, reps: '5', weight: '100kg', restTime: 120 },
        ],
    },
];

const sampleLogs: WorkoutLog[] = [];

const parseFirstNumber = (value?: string): number => {
    if (!value) return 0;
    const match = value.match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
};

const parseWeightKg = (value?: string): number => {
    if (!value || value.toLowerCase() === 'bw') return 0;
    const amount = parseFirstNumber(value);
    return value.toLowerCase().includes('lb') ? Math.round(amount / 2.20462) : amount;
};

export const useWorkoutStore = create<WorkoutState>()(persist((set) => ({
    workouts: sampleWorkouts,
    workoutLogs: sampleLogs,
    activeWorkout: null,
    timer: {
        isRunning: false,
        currentTime: 0,
        totalTime: 0,
        isRest: false,
        currentExerciseIndex: 0,
    },
    weeklySchedule: {
        Mon: 'Push Day',
        Tue: 'Pull Day',
        Wed: 'Leg Day',
        Thu: 'HIIT Cardio',
        Fri: 'Full Body Power',
        Sat: 'Morning Yoga',
        Sun: 'Rest',
    },

    startWorkout: (workout: Workout) => {
        try {
            const { useSessionStore } = require('./sessionStore');
            useSessionStore.getState().startSession(workout);
        } catch {
            // Session store is persisted separately; activeWorkout remains the UI fallback.
        }
        set({
            activeWorkout: {
                ...workout,
                exercises: workout.exercises.map((exercise) => ({ ...exercise, completed: false })),
            },
            timer: {
                isRunning: true,
                currentTime: 0,
                totalTime: workout.duration * 60,
                isRest: false,
                currentExerciseIndex: 0,
            },
        });
    },

    completeExercise: (index: number) => {
        set((state) => {
            if (!state.activeWorkout) return state;
            const exercise = state.activeWorkout.exercises[index];
            try {
                const { useSessionStore } = require('./sessionStore');
                const session = useSessionStore.getState();
                if (!session.activeSession) session.startSession(state.activeWorkout);
                session.logSet(state.activeWorkout, {
                    repsCompleted: parseFirstNumber(exercise?.reps) || 1,
                    weightKg: parseWeightKg(exercise?.weight) || undefined,
                });
            } catch {
                // Keep the workout UI responsive even if the production session engine is unavailable.
            }
            const exercises = [...state.activeWorkout.exercises];
            exercises[index] = { ...exercises[index], completed: true };
            return {
                activeWorkout: { ...state.activeWorkout, exercises },
                timer: { ...state.timer, currentExerciseIndex: index + 1 },
            };
        });
    },

    endWorkout: (elapsedSeconds) => {
        set((state) => {
            if (!state.activeWorkout) return state;
            const finalSeconds = Math.max(0, elapsedSeconds ?? state.timer.currentTime);
            const finalMinutes = Math.max(1, Math.floor(finalSeconds / 60));
            const newLog: WorkoutLog = {
                id: `l${Date.now()}`,
                workoutId: state.activeWorkout.id,
                workoutName: state.activeWorkout.name,
                date: new Date().toISOString().split('T')[0],
                duration: finalMinutes,
                caloriesBurned: state.activeWorkout.calories,
                completed: true,
            };

            try {
                const { useSessionStore } = require('./sessionStore');
                const session = useSessionStore.getState().activeSession;
                const completedSets = session?.loggedSets.length ?? 0;
                const volumeKg = Math.round(session?.loggedSets.reduce((sum: number, loggedSet: { weightKg?: number; repsCompleted: number }) => sum + (loggedSet.weightKg ?? 0) * loggedSet.repsCompleted, 0) ?? 0);
                newLog.completedSets = completedSets;
                newLog.volumeKg = volumeKg;
                useSessionStore.getState().completeSession(state.activeWorkout);

                const { writeCompletedWorkoutToHealth } = require('../utils/HealthEngine');
                void writeCompletedWorkoutToHealth({
                    workoutName: state.activeWorkout.name,
                    startedAt: session?.startedAt ?? new Date(Date.now() - finalSeconds * 1000).toISOString(),
                    endedAt: new Date().toISOString(),
                    durationMinutes: finalMinutes,
                    calories: state.activeWorkout.calories,
                    workoutType: state.activeWorkout.category === 'cardio' ? 'running' : 'strength_training',
                });
            } catch {
                // Health sync should never block local workout completion.
            }

            try {
                const { useProgressStore } = require('./progressStore');
                const day = new Date().getDay(); // 0 Sun ... 6 Sat
                const idx = (day + 6) % 7; // 0 Mon ... 6 Sun
                const progress = useProgressStore.getState();
                const weeklyWorkoutMinutes = [...progress.weeklyWorkoutMinutes];
                const weeklyCalories = [...progress.weeklyCalories];
                weeklyWorkoutMinutes[idx] = (weeklyWorkoutMinutes[idx] || 0) + finalMinutes;
                weeklyCalories[idx] = (weeklyCalories[idx] || 0) + state.activeWorkout.calories;
                useProgressStore.setState({ weeklyWorkoutMinutes, weeklyCalories });
            } catch (e) {
                console.warn('Failed to sync progress stats', e);
            }

            return {
                activeWorkout: null,
                timer: { isRunning: false, currentTime: 0, totalTime: 0, isRest: false, currentExerciseIndex: 0 },
                workoutLogs: [newLog, ...state.workoutLogs],
            };
        });
    },

    logWorkout: (log: WorkoutLog) => {
        set((state) => ({
            workoutLogs: [log, ...state.workoutLogs],
        }));
    },

    reset: () => {
        set({ workoutLogs: [], activeWorkout: null, timer: { isRunning: false, currentTime: 0, totalTime: 0, isRest: false, currentExerciseIndex: 0 } });
    },
}), {
    name: 'jfit-workouts',
    storage: createJSONStorage(() => appStorage),
    partialize: (state) => ({
        workoutLogs: state.workoutLogs,
        activeWorkout: state.activeWorkout,
        timer: state.timer,
        weeklySchedule: state.weeklySchedule,
    }),
}));
