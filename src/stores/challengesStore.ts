import { create } from 'zustand';
import { useWorkoutStore } from './workoutStore';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    type: 'workouts' | 'streak' | 'calories' | 'distance' | 'meals' | 'weight_log';
    target: number;
    unit: string;
    duration: 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
    progress: number;
    completed: boolean;
    reward: string;
}

interface ChallengesState {
    challenges: Challenge[];
    joinChallenge: (id: string) => void;
    updateProgress: (id: string, progress: number) => void;
    refreshProgress: () => void;
}

const today = new Date();
const weekEnd = new Date(today);
weekEnd.setDate(today.getDate() + (7 - today.getDay()));
const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const fmt = (d: Date) => d.toISOString().split('T')[0];

const defaultChallenges: Challenge[] = [
    {
        id: 'c1',
        title: 'Workout Warrior',
        description: 'Complete 5 workouts this week',
        icon: '💪',
        color: '#FF6B9D',
        type: 'workouts',
        target: 5,
        unit: 'workouts',
        duration: 'weekly',
        startDate: fmt(today),
        endDate: fmt(weekEnd),
        progress: 0,
        completed: false,
        reward: '🏅 Iron Warrior Badge',
    },
    {
        id: 'c2',
        title: 'Calorie Crusher',
        description: 'Burn 2,500 calories this week',
        icon: '🔥',
        color: '#F59E0B',
        type: 'calories',
        target: 2500,
        unit: 'cal',
        duration: 'weekly',
        startDate: fmt(today),
        endDate: fmt(weekEnd),
        progress: 0,
        completed: false,
        reward: '🏅 Inferno Badge',
    },
    {
        id: 'c3',
        title: 'Streak Seeker',
        description: 'Maintain a 7-day workout streak',
        icon: '⚡',
        color: '#A78BFA',
        type: 'streak',
        target: 7,
        unit: 'days',
        duration: 'weekly',
        startDate: fmt(today),
        endDate: fmt(weekEnd),
        progress: 0,
        completed: false,
        reward: '🏅 Lightning Streak Badge',
    },
    {
        id: 'c4',
        title: 'Monthly Monster',
        description: 'Complete 20 workouts this month',
        icon: '🏆',
        color: '#00E5C7',
        type: 'workouts',
        target: 20,
        unit: 'workouts',
        duration: 'monthly',
        startDate: fmt(today),
        endDate: fmt(monthEnd),
        progress: 21, // already done from sample logs!
        completed: true,
        reward: '🥇 Monthly Champion Badge',
    },
    {
        id: 'c5',
        title: 'Early Bird',
        description: 'Complete 3 morning workouts (before 9am)',
        icon: '🌅',
        color: '#F97316',
        type: 'workouts',
        target: 3,
        unit: 'sessions',
        duration: 'weekly',
        startDate: fmt(today),
        endDate: fmt(weekEnd),
        progress: 1,
        completed: false,
        reward: '🏅 Rise & Grind Badge',
    },
    {
        id: 'c6',
        title: 'Iron Consistency',
        description: 'Log weight every day for 2 weeks',
        icon: '⚖️',
        color: '#3B82F6',
        type: 'weight_log',
        target: 14,
        unit: 'days',
        duration: 'monthly',
        startDate: fmt(today),
        endDate: fmt(monthEnd),
        progress: 5,
        completed: false,
        reward: '🏅 Precision Badge',
    },
];

export const useChallengesStore = create<ChallengesState>((set, get) => ({
    challenges: defaultChallenges,

    joinChallenge: (id) => {
        set((state) => ({
            challenges: state.challenges.map((c) =>
                c.id === id ? { ...c, startDate: fmt(new Date()) } : c
            ),
        }));
    },

    updateProgress: (id, progress) => {
        set((state) => ({
            challenges: state.challenges.map((c) =>
                c.id === id
                    ? { ...c, progress, completed: progress >= c.target }
                    : c
            ),
        }));
    },

    refreshProgress: () => {
        const { workoutLogs } = useWorkoutStore.getState();
        const nowStr = fmt(new Date());

        // Count workouts this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = fmt(weekStart);
        const weekWorkouts = workoutLogs.filter((l) => l.date >= weekStartStr && l.date <= nowStr);
        const weekCalories = weekWorkouts.reduce((s, l) => s + l.caloriesBurned, 0);

        // Streak
        const logDates = [...new Set(workoutLogs.map((l) => l.date))].sort().reverse();
        let streak = 0;
        for (let i = 0; i < logDates.length; i++) {
            const exp = new Date();
            exp.setDate(exp.getDate() - i);
            if (logDates[i] === fmt(exp)) streak++;
            else break;
        }

        // Monthly workouts
        const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const monthWorkouts = workoutLogs.filter((l) => l.date.startsWith(monthStr)).length;

        set((state) => ({
            challenges: state.challenges.map((c) => {
                let p = c.progress;
                if (c.id === 'c1') p = weekWorkouts.length;
                if (c.id === 'c2') p = weekCalories;
                if (c.id === 'c3') p = streak;
                if (c.id === 'c4') p = monthWorkouts;
                return { ...c, progress: p, completed: p >= c.target };
            }),
        }));
    },
}));
