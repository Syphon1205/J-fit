import { Platform, PermissionsAndroid } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { Capacitor } from '@capacitor/core';
import { Health } from 'capacitor-health';
import type { HealthPermission, HealthPlugin } from 'capacitor-health';

export interface HealthSnapshot {
    stepsToday: number;
    distanceKmToday?: number;
    activeCaloriesToday?: number;
    weeklyActiveCalories?: number[];
    heartRateBpm?: number;
    restingHeartRateBpm?: number;
    hrvMs?: number;
    sleepHours?: number;
    bodyWeightKg?: number;
    weeklySteps: number[];
    sourceLabel: string;
    syncedAt: string;
}

const startOfDay = (d: Date) => {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
};

const endOfDay = (d: Date) => {
    const n = new Date(d);
    n.setHours(23, 59, 59, 999);
    return n;
};

const normalizeWorkoutDistanceKm = (distance?: number) => {
    if (!distance || !Number.isFinite(distance)) return 0;
    return distance > 100 ? distance / 1000 : distance;
};

const healthPermissions = [
    'READ_STEPS',
    'READ_WORKOUTS',
    'READ_ACTIVE_CALORIES',
    'READ_DISTANCE',
    'READ_HEART_RATE',
    'READ_ROUTE',
    'READ_SLEEP',
    'READ_RESTING_HEART_RATE',
    'READ_HRV',
    'READ_BODY_WEIGHT',
] as HealthPermission[];
const distanceDataType = 'distance' as 'steps';
const sleepDataType = 'sleep' as 'steps';
const heartRateDataType = 'heart-rate' as 'steps';
const restingHeartRateDataType = 'resting-heart-rate' as 'steps';
const hrvDataType = 'hrv' as 'steps';
const bodyWeightDataType = 'body-weight' as 'steps';

function getNativeHealth(): HealthPlugin | null {
    if (Capacitor.getPlatform() === 'web') return null;
    if (!Capacitor.isPluginAvailable('HealthPlugin') && !Capacitor.isPluginAvailable('Health')) return null;
    return Health;
}

async function fetchNativeHealthSnapshot(): Promise<HealthSnapshot | null> {
    const nativeHealth = getNativeHealth();
    if (!nativeHealth) return null;

    const availability = await nativeHealth.isHealthAvailable();
    if (!availability.available) return null;

    if (Capacitor.getPlatform() !== 'ios') {
        try {
            const permissionState = await nativeHealth.checkHealthPermissions({
                permissions: healthPermissions,
            });
            const allowed = permissionState.permissions.flatMap((item) => Object.values(item)).some(Boolean);
            if (!allowed) return null;
        } catch {
            return null;
        }
    }

    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = new Date(dayStart);
    weekStart.setDate(dayStart.getDate() - 6);

    const [
        stepBuckets,
        calorieBuckets,
        distanceBuckets,
        sleepBuckets,
        heartRateBuckets,
        restingHeartRateBuckets,
        hrvBuckets,
        bodyWeightBuckets,
        workouts,
    ] = await Promise.all([
        nativeHealth.queryAggregated({
            startDate: weekStart.toISOString(),
            endDate: now.toISOString(),
            dataType: 'steps',
            bucket: 'day',
        }),
        nativeHealth.queryAggregated({
            startDate: weekStart.toISOString(),
            endDate: now.toISOString(),
            dataType: 'active-calories',
            bucket: 'day',
        }).catch(() => ({ aggregatedData: [] })),
        nativeHealth.queryAggregated({
            startDate: weekStart.toISOString(),
            endDate: now.toISOString(),
            dataType: distanceDataType,
            bucket: 'day',
        }).catch(() => ({ aggregatedData: [] })),
        nativeHealth.queryAggregated({
            startDate: weekStart.toISOString(),
            endDate: now.toISOString(),
            dataType: sleepDataType,
            bucket: 'day',
        }).catch(() => ({ aggregatedData: [] })),
        nativeHealth.queryAggregated({
            startDate: dayStart.toISOString(),
            endDate: now.toISOString(),
            dataType: heartRateDataType,
            bucket: 'day',
        }).catch(() => ({ aggregatedData: [] })),
        nativeHealth.queryAggregated({
            startDate: weekStart.toISOString(),
            endDate: now.toISOString(),
            dataType: restingHeartRateDataType,
            bucket: 'day',
        }).catch(() => ({ aggregatedData: [] })),
        nativeHealth.queryAggregated({
            startDate: weekStart.toISOString(),
            endDate: now.toISOString(),
            dataType: hrvDataType,
            bucket: 'day',
        }).catch(() => ({ aggregatedData: [] })),
        nativeHealth.queryAggregated({
            startDate: weekStart.toISOString(),
            endDate: now.toISOString(),
            dataType: bodyWeightDataType,
            bucket: 'day',
        }).catch(() => ({ aggregatedData: [] })),
        nativeHealth.queryWorkouts({
            startDate: dayStart.toISOString(),
            endDate: now.toISOString(),
            includeHeartRate: true,
            includeRoute: false,
            includeSteps: false,
        }).catch(() => ({ workouts: [] })),
    ]);

    const weeklySteps = Array.from({ length: 7 }).map((_, index) => Math.round(stepBuckets.aggregatedData[index]?.value ?? 0));
    const stepsToday = weeklySteps[weeklySteps.length - 1] ?? 0;
    const weeklyActiveCalories = Array.from({ length: 7 }).map((_, index) => Math.round(calorieBuckets.aggregatedData[index]?.value ?? 0));
    const workoutCaloriesToday = workouts.workouts.reduce((sum, workout) => sum + (workout.calories || 0), 0);
    const activeCaloriesToday = weeklyActiveCalories.at(-1) || Math.round(workoutCaloriesToday) || undefined;
    const workoutDistanceKmToday = workouts.workouts.reduce((sum, workout) => sum + normalizeWorkoutDistanceKm(workout.distance), 0);
    const distanceKmToday = normalizeWorkoutDistanceKm(distanceBuckets.aggregatedData.at(-1)?.value) || workoutDistanceKmToday;
    const heartSamples = workouts.workouts.flatMap((workout) => workout.heartRate ?? []);
    const latestHeartSample = heartSamples.at(-1);
    const latestHeartRate = heartRateBuckets.aggregatedData.at(-1)?.value;
    const latestRestingHeartRate = restingHeartRateBuckets.aggregatedData.at(-1)?.value;
    const latestHrv = hrvBuckets.aggregatedData.at(-1)?.value;
    const latestSleep = sleepBuckets.aggregatedData.at(-1)?.value;
    const latestBodyWeight = bodyWeightBuckets.aggregatedData.filter((item) => item.value > 0).at(-1)?.value;

    return {
        stepsToday,
        distanceKmToday: distanceKmToday > 0 ? Number(distanceKmToday.toFixed(2)) : undefined,
        activeCaloriesToday,
        heartRateBpm: latestHeartRate ? Math.round(latestHeartRate) : latestHeartSample?.bpm ? Math.round(latestHeartSample.bpm) : undefined,
        restingHeartRateBpm: latestRestingHeartRate ? Math.round(latestRestingHeartRate) : undefined,
        hrvMs: latestHrv ? Math.round(latestHrv) : undefined,
        sleepHours: latestSleep ? Number(latestSleep.toFixed(1)) : undefined,
        bodyWeightKg: latestBodyWeight ? Number(latestBodyWeight.toFixed(1)) : undefined,
        weeklySteps,
        weeklyActiveCalories,
        sourceLabel: Capacitor.getPlatform() === 'ios' ? 'Apple Health' : 'Google Health Connect',
        syncedAt: now.toISOString(),
    };
}

export async function requestDeviceHealthPermissions(): Promise<boolean> {
    const nativeHealth = getNativeHealth();
    if (nativeHealth) {
        try {
            const availability = await nativeHealth.isHealthAvailable();
            if (availability.available) {
                await nativeHealth.requestHealthPermissions({
                    permissions: healthPermissions,
                });
                return true;
            }
        } catch {
            // Fall back to the motion permission path below.
        }
    }

    const available = await Pedometer.isAvailableAsync();
    if (!available) return false;

    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
            {
                title: 'Activity Permission',
                message: 'Cunningham Fitness needs activity permission to read steps from your phone health services.',
                buttonPositive: 'Allow',
                buttonNegative: 'Deny',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // iOS does not need a separate prompt for Pedometer API.
    return true;
}

async function fetchPedometerSnapshot(): Promise<HealthSnapshot> {
    const available = await Pedometer.isAvailableAsync();
    if (!available) {
        throw new Error('Step sensor is not available on this device.');
    }

    const now = new Date();
    const dayStart = startOfDay(now);
    const today = await Pedometer.getStepCountAsync(dayStart, now);

    const weeklySteps: number[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const start = startOfDay(d);
        const end = i === 0 ? now : endOfDay(d);

        try {
            const sample = await Pedometer.getStepCountAsync(start, end);
            weeklySteps.push(sample.steps || 0);
        } catch {
            weeklySteps.push(0);
        }
    }

    const stepsToday = today.steps || 0;
    return {
        stepsToday,
        weeklySteps,
        sourceLabel: Platform.OS === 'ios' ? 'Apple motion steps' : 'Android motion steps',
        syncedAt: new Date().toISOString(),
    };
}

export async function fetchHealthSnapshot(options: { allowNative?: boolean } = {}): Promise<HealthSnapshot> {
    if (options.allowNative) {
        const nativeSnapshot = await fetchNativeHealthSnapshot().catch(() => null);
        if (nativeSnapshot) return nativeSnapshot;
        throw new Error('Native health sync is not available. Open Health and Privacy and reconnect Apple Health or Health Connect on a physical device.');
    }

    return fetchPedometerSnapshot();
}
