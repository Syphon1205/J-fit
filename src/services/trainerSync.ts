import { useAuthStore } from '../stores/authStore';
import { useHealthStore } from '../stores/healthStore';
import { useProgressStore } from '../stores/progressStore';
import { useRunStore } from '../stores/runStore';
import { useWorkoutStore } from '../stores/workoutStore';

export type TrainerPairingStatus = 'idle' | 'searching' | 'ready' | 'error';

export interface TrainerMetricPayload {
    protocolVersion: 1;
    athlete: {
        id: string;
        name: string;
        goal: string;
        deviceId: string;
    };
    capturedAt: string;
    health: {
        stepsToday: number;
        distanceKmToday?: number;
        activeCaloriesToday?: number;
        heartRateBpm?: number;
        restingHeartRateBpm?: number;
        hrvMs?: number;
        sleepHours?: number;
        sourceLabel: string;
        syncedAt: string;
    } | null;
    training: {
        workoutsCompleted: number;
        weeklyWorkoutMinutes: number[];
        weeklySteps: number[];
        weeklyCalories: number[];
        recentRuns: Array<{
            date: string;
            distanceKm: number;
            durationSeconds: number;
            avgPaceMinKm: number;
            calories: number;
        }>;
        weightHistory: Array<{
            date: string;
            kg: number;
        }>;
    };
    flags: string[];
}

const goalLabels: Record<string, string> = {
    lose_weight: 'Lean out',
    build_muscle: 'Build muscle',
    stay_fit: 'Stay fit',
    improve_endurance: 'Improve endurance',
};

export function buildTrainerMetricPayload(): TrainerMetricPayload {
    const auth = useAuthStore.getState();
    const health = useHealthStore.getState();
    const progress = useProgressStore.getState();
    const runs = useRunStore.getState();
    const workouts = useWorkoutStore.getState();
    const user = auth.user;
    const latestSnapshot = health.latestSnapshot;
    const flags: string[] = [];

    if (!latestSnapshot) flags.push('Health data not synced');
    if (latestSnapshot && !latestSnapshot.sleepHours) flags.push('Sleep data missing');
    if (latestSnapshot && !latestSnapshot.hrvMs) flags.push('HRV missing');
    if (progress.weeklyWorkoutMinutes.every((minutes) => minutes === 0)) flags.push('No workout minutes this week');

    return {
        protocolVersion: 1,
        athlete: {
            id: user?.id ?? 'local_user',
            name: user?.name ?? 'Cunningham Athlete',
            goal: goalLabels[user?.fitnessGoal ?? ''] ?? 'General fitness',
            deviceId: auth.deviceId ?? 'local-device',
        },
        capturedAt: new Date().toISOString(),
        health: latestSnapshot ? {
            stepsToday: latestSnapshot.stepsToday,
            distanceKmToday: latestSnapshot.distanceKmToday,
            activeCaloriesToday: latestSnapshot.activeCaloriesToday,
            heartRateBpm: latestSnapshot.heartRateBpm,
            restingHeartRateBpm: latestSnapshot.restingHeartRateBpm,
            hrvMs: latestSnapshot.hrvMs,
            sleepHours: latestSnapshot.sleepHours,
            sourceLabel: latestSnapshot.sourceLabel,
            syncedAt: latestSnapshot.syncedAt,
        } : null,
        training: {
            workoutsCompleted: workouts.workoutLogs.length,
            weeklyWorkoutMinutes: progress.weeklyWorkoutMinutes,
            weeklySteps: progress.weeklySteps,
            weeklyCalories: progress.weeklyCalories,
            recentRuns: runs.sessions.slice(0, 5).map((run) => ({
                date: run.date,
                distanceKm: run.distance,
                durationSeconds: run.duration,
                avgPaceMinKm: run.avgPace,
                calories: run.calories,
            })),
            weightHistory: progress.weightHistory.slice(-12).map((entry) => ({
                date: entry.date,
                kg: entry.value,
            })),
        },
        flags,
    };
}

export function createPairingCode(deviceId: string) {
    const compact = deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    return compact || 'LOCAL';
}
