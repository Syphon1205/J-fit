import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';
import { fetchHealthSnapshot, HealthSnapshot } from '../services/healthData';
import { useProgressStore } from './progressStore';
import { enableHealthBackgroundDelivery, initializeHealthSDK } from '../utils/HealthEngine';

export type HealthPermissionStatus = 'not_requested' | 'granted' | 'denied' | 'partial';

export interface HealthDataType {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'activity' | 'body' | 'sleep' | 'vitals';
    enabled: boolean;
}

export interface HealthSource {
    id: 'apple_health' | 'google_health';
    name: string;
    platform: 'ios' | 'android' | 'both';
    color: string;
    icon: string;
    connected: boolean;
    permissionStatus: HealthPermissionStatus;
    lastSync: string | null;
    syncing: boolean;
}

interface HealthState {
    sources: HealthSource[];
    dataTypes: HealthDataType[];
    latestSnapshot: HealthSnapshot | null;
    lastError: string | null;
    syncHealthSnapshot: () => Promise<void>;
    requestPermission: (sourceId: string) => Promise<void>;
    syncNow: (sourceId: string) => Promise<void>;
    toggleDataType: (id: string) => void;
    disconnect: (sourceId: string) => void;
    reset: () => void;
}

const defaultDataTypes: HealthDataType[] = [
    { id: 'steps', name: 'Steps', description: 'Daily step count and distance', icon: 'footsteps-outline', category: 'activity', enabled: true },
    { id: 'workouts', name: 'Workouts', description: 'Exercise sessions and calories', icon: 'barbell-outline', category: 'activity', enabled: true },
    { id: 'heart_rate', name: 'Heart Rate', description: 'Resting and active heart rate', icon: 'heart-outline', category: 'vitals', enabled: true },
    { id: 'active_energy', name: 'Active Calories', description: 'Calories burned during activity', icon: 'flame-outline', category: 'activity', enabled: true },
    { id: 'resting_energy', name: 'Resting Calories', description: 'Basal metabolic rate calories', icon: 'bed-outline', category: 'activity', enabled: false },
    { id: 'weight', name: 'Body Weight', description: 'Weight measurements over time', icon: 'scale-outline', category: 'body', enabled: true },
    { id: 'bmi', name: 'BMI', description: 'Body mass index tracking', icon: 'body-outline', category: 'body', enabled: false },
    { id: 'sleep', name: 'Sleep', description: 'Sleep duration and quality', icon: 'moon-outline', category: 'sleep', enabled: true },
    { id: 'hrv', name: 'Heart Rate Variability', description: 'Recovery and readiness score', icon: 'pulse-outline', category: 'vitals', enabled: true },
    { id: 'vo2max', name: 'VO₂ Max', description: 'Cardio fitness estimate', icon: 'speedometer-outline', category: 'vitals', enabled: false },
    { id: 'blood_oxygen', name: 'Blood Oxygen', description: 'SpO₂ percentage', icon: 'water-outline', category: 'vitals', enabled: false },
];

export const useHealthStore = create<HealthState>()(persist((set, get) => ({
    sources: [
        {
            id: 'apple_health',
            name: 'Apple Health',
            platform: 'ios',
            color: '#FF2D55',
            icon: 'heart',
            connected: false,
            permissionStatus: 'not_requested',
            lastSync: null,
            syncing: false,
        },
        {
            id: 'google_health',
            name: 'Health Connect',
            platform: 'android',
            color: '#4285F4',
            icon: 'fitness',
            connected: false,
            permissionStatus: 'not_requested',
            lastSync: null,
            syncing: false,
        },
    ],
    dataTypes: defaultDataTypes,
    latestSnapshot: null,
    lastError: null,

    syncHealthSnapshot: async () => {
        try {
            const allowNative = get().sources.some((source) => source.connected);
            const snapshot = await fetchHealthSnapshot({ allowNative });
            useProgressStore.getState().setWeeklySteps(snapshot.weeklySteps);
            if (snapshot.weeklyActiveCalories) useProgressStore.getState().setWeeklyCalories(snapshot.weeklyActiveCalories);
            set({ latestSnapshot: snapshot, lastError: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Device health data is unavailable.';
            set({ lastError: message });
        }
    },

    requestPermission: async (sourceId: string) => {
        set((state) => ({
            lastError: null,
            sources: state.sources.map((s) =>
                s.id === sourceId ? { ...s, syncing: true } : s
            ),
        }));

        try {
            const nativeHealth = await initializeHealthSDK();
            if (nativeHealth.status !== 'granted') {
                set((state) => ({
                    lastError: nativeHealth.message,
                    sources: state.sources.map((s) =>
                        s.id === sourceId ? { ...s, connected: false, permissionStatus: 'denied', syncing: false } : s
                    ),
                }));
                return;
            }

            void enableHealthBackgroundDelivery();
            const snapshot = await fetchHealthSnapshot({ allowNative: true });
            useProgressStore.getState().setWeeklySteps(snapshot.weeklySteps);
            if (snapshot.weeklyActiveCalories) useProgressStore.getState().setWeeklyCalories(snapshot.weeklyActiveCalories);

            set((state) => ({
                latestSnapshot: {
                    ...snapshot,
                    sourceLabel: nativeHealth.status === 'granted'
                        ? (sourceId === 'apple_health' ? 'Apple Health' : 'Google Health Connect')
                        : snapshot.sourceLabel,
                },
                lastError: nativeHealth.status === 'unavailable' ? nativeHealth.message : null,
                sources: state.sources.map((s) =>
                    s.id === sourceId
                        ? { ...s, connected: true, permissionStatus: nativeHealth.status === 'granted' ? 'granted' : 'partial', lastSync: 'Just now', syncing: false }
                        : s
                ),
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to connect to device health data.';
            set((state) => ({
                lastError: message,
                sources: state.sources.map((s) =>
                    s.id === sourceId ? { ...s, connected: false, permissionStatus: 'denied', syncing: false } : s
                ),
            }));
        }
    },

    syncNow: async (sourceId: string) => {
        set((state) => ({
            lastError: null,
            sources: state.sources.map((s) =>
                s.id === sourceId ? { ...s, syncing: true } : s
            ),
        }));

        try {
            const snapshot = await fetchHealthSnapshot({ allowNative: true });
            useProgressStore.getState().setWeeklySteps(snapshot.weeklySteps);
            if (snapshot.weeklyActiveCalories) useProgressStore.getState().setWeeklyCalories(snapshot.weeklyActiveCalories);

            set((state) => ({
                latestSnapshot: snapshot,
                lastError: null,
                sources: state.sources.map((s) =>
                    s.id === sourceId ? { ...s, syncing: false, lastSync: 'Just now' } : s
                ),
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sync failed.';
            set((state) => ({
                lastError: message,
                sources: state.sources.map((s) =>
                    s.id === sourceId ? { ...s, syncing: false } : s
                ),
            }));
        }
    },

    toggleDataType: (id: string) =>
        set((state) => ({
            dataTypes: state.dataTypes.map((d) =>
                d.id === id ? { ...d, enabled: !d.enabled } : d
            ),
        })),

    disconnect: (sourceId: string) =>
        set((state) => ({
            latestSnapshot: state.latestSnapshot,
            sources: state.sources.map((s) =>
                s.id === sourceId
                    ? { ...s, connected: false, permissionStatus: 'not_requested', lastSync: null }
                    : s
            ),
        })),

    reset: () =>
        set({
            sources: [
                {
                    id: 'apple_health',
                    name: 'Apple Health',
                    platform: 'ios',
                    color: '#FF2D55',
                    icon: 'heart',
                    connected: false,
                    permissionStatus: 'not_requested',
                    lastSync: null,
                    syncing: false,
                },
                {
                    id: 'google_health',
                    name: 'Health Connect',
                    platform: 'android',
                    color: '#4285F4',
                    icon: 'fitness',
                    connected: false,
                    permissionStatus: 'not_requested',
                    lastSync: null,
                    syncing: false,
                },
            ],
            dataTypes: defaultDataTypes,
            latestSnapshot: null,
            lastError: null,
        }),
}), {
    name: 'jfit-health',
    storage: createJSONStorage(() => appStorage),
    partialize: (state) => ({
        sources: state.sources,
        dataTypes: state.dataTypes,
        latestSnapshot: state.latestSnapshot,
        lastError: state.lastError,
    }),
}));
