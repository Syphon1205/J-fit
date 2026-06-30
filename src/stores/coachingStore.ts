import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';
import { calculateProgressiveOverload, OverloadResult } from '../modules/coaching/overloadEngine';
import { calculateDailyPerformanceCapacity, DailyReadinessResult } from '../modules/coaching/readinessEngine';
import { prioritizeDailyBriefingTiles, DailyBriefingTilePriority } from '../modules/dashboard/dailyBriefingEngine';
import { useHealthStore } from './healthStore';
import { useNutritionStore } from './nutritionStore';
import { useSessionStore } from './sessionStore';
import { useWorkoutStore } from './workoutStore';

interface CoachingState {
    readiness: DailyReadinessResult | null;
    overload: OverloadResult | null;
    dailyBriefing: DailyBriefingTilePriority[];
    refresh: () => void;
    reset: () => void;
}

function todayWorkoutName() {
    const { weeklySchedule } = useWorkoutStore.getState();
    const todayDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    return weeklySchedule[todayDay];
}

export const useCoachingStore = create<CoachingState>()(
    persist((set) => ({
        readiness: null,
        overload: null,
        dailyBriefing: [],

        refresh: () => {
            const { latestSnapshot, sources } = useHealthStore.getState();
            const { dailyGoals, weeklyPlan, selectedDay, waterIntake } = useNutritionStore.getState();
            const { activeSession } = useSessionStore.getState();
            const { workoutLogs } = useWorkoutStore.getState();

            const todayMeals = weeklyPlan[selectedDay];
            const proteinDeficit = Math.max(0, dailyGoals.protein - (todayMeals?.totalProtein ?? 0));
            const carbsDeficit = Math.max(0, dailyGoals.carbs - (todayMeals?.totalCarbs ?? 0));
            const hydrationDeficit = Math.max(0, dailyGoals.water - waterIntake);

            const readiness = latestSnapshot
                ? calculateDailyPerformanceCapacity({
                    sleepHours: 7.2,
                    sleepQualityScore: 74,
                    restingHeartRateDeltaBpm: 1,
                    fatigueScore: 2,
                    trainingLoadLast72h: Math.min(100, workoutLogs.slice(0, 3).reduce((sum, log) => sum + log.duration, 0)),
                    nutritionCompliancePercent: Math.max(0, 100 - proteinDeficit),
                })
                : null;

            const latestWorkout = workoutLogs[0];
            const overload = latestWorkout
                ? calculateProgressiveOverload({
                    exerciseId: latestWorkout.workoutId,
                    exerciseName: latestWorkout.workoutName,
                    targetReps: 8,
                    achievedReps: latestWorkout.completed ? 8 : 6,
                    loadKg: 80,
                    targetRpe: 8,
                    actualRpe: latestWorkout.completed ? 7.5 : 9,
                    recentOutcomes: workoutLogs.slice(0, 3).map((log, index) => ({
                        achievedReps: log.completed ? 8 : 6,
                        actualRpe: index === 0 ? 8.5 : 7.5,
                        loadKg: 80,
                    })),
                })
                : null;

            const briefing = prioritizeDailyBriefingTiles({
                hasActiveSession: Boolean(activeSession),
                readinessBand: readiness?.band,
                overloadDecision: overload?.decision,
                proteinDeficitGrams: proteinDeficit,
                carbsDeficitGrams: carbsDeficit,
                hydrationDeficitServings: hydrationDeficit,
                healthConnected: sources.some((source) => source.connected),
                adherenceScore: 100,
                minutesUntilWorkout: todayWorkoutName() ? 45 : null,
            });

            set({
                readiness,
                overload,
                dailyBriefing: briefing,
            });
        },

        reset: () => set({ readiness: null, overload: null, dailyBriefing: [] }),
    }), {
        name: 'jfit-coaching',
        storage: createJSONStorage(() => appStorage),
        partialize: (state) => ({
            readiness: state.readiness,
            overload: state.overload,
            dailyBriefing: state.dailyBriefing,
        }),
    })
);
