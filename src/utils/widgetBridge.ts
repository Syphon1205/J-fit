import { registerPlugin } from '@capacitor/core';
import { useNutritionStore } from '../stores/nutritionStore';
import { useProgressStore } from '../stores/progressStore';

export interface WidgetBridgePlugin {
    setWidgetData(options: { key: string; data: string }): Promise<void>;
}

export interface WatchBridgePlugin {
    syncData(options: { activeCalories?: number; protein?: number; carbs?: number; fat?: number }): Promise<void>;
}

export const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');
export const WatchBridge = registerPlugin<WatchBridgePlugin>('WatchBridge');

let hasInit = false;

export function initWidgetSync() {
    if (hasInit) return;
    hasInit = true;

    try {
        // Sync nutrition whenever it changes
        useNutritionStore.subscribe((state) => {
            try {
                if (!state || !state.weeklyPlan) return;
                const todayPlan = state.weeklyPlan[state.selectedDay || 0];
                const data = {
                    calories: todayPlan?.totalCalories || 0,
                    protein: todayPlan?.totalProtein || 0,
                    carbs: todayPlan?.totalCarbs || 0,
                    fat: todayPlan?.totalFat || 0,
                    goalCalories: state.dailyGoals?.calories || 2000,
                    goalProtein: state.dailyGoals?.protein || 140,
                    goalCarbs: state.dailyGoals?.carbs || 180,
                    goalFat: state.dailyGoals?.fat || 65,
                };
                WidgetBridge.setWidgetData({ key: 'nutrition_data', data: JSON.stringify(data) }).catch(() => {});
                WatchBridge.syncData({ protein: data.protein, carbs: data.carbs, fat: data.fat }).catch(() => {});
            } catch (e) {
                console.error('Widget/Watch sync failed', e);
            }
        });
        
        // Initial sync
        const state = useNutritionStore.getState();
        if (state && state.weeklyPlan) {
            const todayPlan = state.weeklyPlan[state.selectedDay || 0];
            const data = {
                calories: todayPlan?.totalCalories || 0,
                protein: todayPlan?.totalProtein || 0,
                carbs: todayPlan?.totalCarbs || 0,
                fat: todayPlan?.totalFat || 0,
                goalCalories: state.dailyGoals?.calories || 2000,
                goalProtein: state.dailyGoals?.protein || 140,
                goalCarbs: state.dailyGoals?.carbs || 180,
                goalFat: state.dailyGoals?.fat || 65,
            };
            WidgetBridge.setWidgetData({ key: 'nutrition_data', data: JSON.stringify(data) }).catch(() => {});
            WatchBridge.syncData({ protein: data.protein, carbs: data.carbs, fat: data.fat }).catch(() => {});
        }

        // Sync progress
        const syncProgress = (state: any) => {
            try {
                if (!state) return;
                const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                const progressData = {
                    steps: state.weeklySteps?.[today] || 0,
                    activeCalories: state.weeklyCalories?.[today] || 0,
                    workoutMinutes: state.weeklyWorkoutMinutes?.[today] || 0,
                    weeklySteps: state.weeklySteps || [0,0,0,0,0,0,0],
                    weeklyCalories: state.weeklyCalories || [0,0,0,0,0,0,0],
                    weeklyWorkoutMinutes: state.weeklyWorkoutMinutes || [0,0,0,0,0,0,0],
                };
                WidgetBridge.setWidgetData({ key: 'progress_data', data: JSON.stringify(progressData) }).catch(() => {});
                WatchBridge.syncData({ activeCalories: progressData.activeCalories }).catch(() => {});
            } catch (e) {
                console.error('Progress sync failed', e);
            }
        };

        useProgressStore.subscribe(syncProgress);
        syncProgress(useProgressStore.getState());
    } catch (e) {
        console.error('Failed to init widget sync', e);
    }
}
