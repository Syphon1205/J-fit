import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Health } from 'capacitor-health';
import type { HealthPermission, HealthPlugin } from 'capacitor-health';

export type HealthPermissionStatus = 'granted' | 'unavailable' | 'denied';

export interface HealthInitResult {
    platform: string;
    status: HealthPermissionStatus;
    message: string;
}

export interface CompletedWorkoutHealthPayload {
    workoutName: string;
    startedAt: string;
    endedAt: string;
    durationMinutes: number;
    calories: number;
    workoutType?: string;
}

type HealthBridge = {
    Health?: HealthPlugin;
    isHealthAvailable?: HealthPlugin['isHealthAvailable'];
    checkHealthPermissions?: HealthPlugin['checkHealthPermissions'];
    requestHealthPermissions?: (options?: unknown) => Promise<unknown>;
    requestAuthorization?: (options?: unknown) => Promise<unknown>;
};

const permissions = [
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

function getHealthBridge(): HealthPlugin | null {
    if (Capacitor.getPlatform() === 'web') return null;
    if (!Capacitor.isPluginAvailable('HealthPlugin') && !Capacitor.isPluginAvailable('Health')) return null;
    return Health;
}

export async function initializeHealthSDK(): Promise<HealthInitResult> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
        return {
            platform,
            status: 'unavailable',
            message: 'Native Health permissions run only on iOS and Android device builds.',
        };
    }

    if (platform === 'ios' && Capacitor.isPluginAvailable('Device')) {
        try {
            const info = await Device.getInfo();
            if (info.isVirtual) {
                return {
                    platform,
                    status: 'unavailable',
                    message: 'Apple Health sync requires a physical iPhone. The simulator cannot provide watch HealthKit data.',
                };
            }
        } catch {
            return {
                platform,
                status: 'unavailable',
                message: 'Unable to verify this iOS device. Test Apple Health sync on a physical iPhone.',
            };
        }
    }

    try {
        const native = getHealthBridge();
        if (!native) {
            return {
                platform,
                status: 'unavailable',
                message: platform === 'android'
                    ? 'Google Health Connect is not available. Install or enable Health Connect, then retry from Settings.'
                    : 'Apple Health is not available in this runtime. Use a physical iPhone with HealthKit enabled for full sync.',
            };
        }
        const availability = typeof (native as HealthPlugin | null)?.isHealthAvailable === 'function'
            ? await (native as HealthPlugin).isHealthAvailable()
            : { available: true };
        const request = (native as HealthBridge | null)?.requestHealthPermissions ?? (native as HealthBridge | null)?.requestAuthorization;

        if (!availability.available || !request) {
            return {
                platform,
                status: 'unavailable',
                message: platform === 'android'
                    ? 'Google Health Connect is not available. Install or enable Health Connect, then retry from Settings.'
                    : 'Apple Health is not available in this runtime. Use a physical iPhone with HealthKit enabled for full sync.',
            };
        }

        if ('queryAggregated' in native) {
            await (native as HealthPlugin).requestHealthPermissions({ permissions });
        } else {
            await request({
                read: ['steps', 'heartRate', 'workouts', 'sleepAnalysis', 'restingHeartRate', 'heartRateVariabilitySDNN', 'bodyMass'],
                write: ['workouts'],
                android: {
                    healthConnect: true,
                    rationale: 'Cunningham Fitness uses Health Connect to calculate readiness and sync completed workouts.',
                },
                ios: {
                    share: ['workouts'],
                    read: ['steps', 'heartRate', 'workouts', 'sleepAnalysis', 'restingHeartRate', 'heartRateVariabilitySDNN', 'bodyMass'],
                },
            });
        }

        return {
            platform,
            status: 'granted',
            message: platform === 'android'
                ? 'Google Health Connect permissions are ready.'
                : 'Apple Health permissions are ready.',
        };
    } catch (error) {
        return {
            platform,
            status: 'denied',
            message: error instanceof Error ? error.message : 'Health permissions were not granted.',
        };
    }
}

export async function writeCompletedWorkoutToHealth(payload: CompletedWorkoutHealthPayload): Promise<HealthInitResult> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
        return { platform, status: 'unavailable', message: 'Workout sync requires a native device build.' };
    }

    try {
        const native = getHealthBridge();
        if (!native) {
            return {
                platform,
                status: 'unavailable',
                message: platform === 'android'
                    ? 'Google Health Connect is unavailable, so this workout was saved locally only.'
                    : 'Apple Health is unavailable, so this workout was saved locally only.',
            };
        }

        const writer = (native as unknown as {
            saveWorkout?: (options: unknown) => Promise<unknown>;
            writeWorkout?: (options: unknown) => Promise<unknown>;
            addWorkout?: (options: unknown) => Promise<unknown>;
        });

        const write = writer.saveWorkout ?? writer.writeWorkout ?? writer.addWorkout;
        if (!write) {
            return {
                platform,
                status: 'unavailable',
                message: 'The installed health bridge does not expose workout writing. Session is saved locally.',
            };
        }

        await write({
            startDate: payload.startedAt,
            endDate: payload.endedAt,
            workoutType: payload.workoutType ?? 'strength_training',
            title: payload.workoutName,
            calories: payload.calories,
            duration: payload.durationMinutes * 60,
        });

        return {
            platform,
            status: 'granted',
            message: platform === 'android' ? 'Workout synced to Health Connect.' : 'Workout synced to Apple Health.',
        };
    } catch (error) {
        return {
            platform,
            status: 'denied',
            message: error instanceof Error ? error.message : 'Workout Health sync failed.',
        };
    }
}

export async function enableHealthBackgroundDelivery(): Promise<HealthInitResult> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
        return { platform, status: 'unavailable', message: 'Health background delivery requires a native device build.' };
    }

    try {
        const native = getHealthBridge();
        if (!native) {
            return {
                platform,
                status: 'unavailable',
                message: platform === 'android'
                    ? 'Google Health Connect background sync is unavailable in this runtime.'
                    : 'Apple Health background delivery is unavailable in this runtime.',
            };
        }

        const delivery = native as unknown as {
            enableBackgroundDelivery?: (options: unknown) => Promise<unknown>;
            enableHealthBackgroundDelivery?: (options: unknown) => Promise<unknown>;
            observeHealthData?: (options: unknown) => Promise<unknown>;
        };
        const enable = delivery.enableBackgroundDelivery ?? delivery.enableHealthBackgroundDelivery ?? delivery.observeHealthData;

        if (!enable) {
            return {
                platform,
                status: 'unavailable',
                message: 'The installed health bridge does not expose background health delivery.',
            };
        }

        await enable({
            dataTypes: ['steps', 'heartRate', 'activeEnergyBurned', 'workouts', 'sleepAnalysis', 'restingHeartRate', 'heartRateVariabilitySDNN'],
            frequency: 'immediate',
        });

        return {
            platform,
            status: 'granted',
            message: platform === 'android' ? 'Health Connect background delivery is active.' : 'Apple Health background delivery is active.',
        };
    } catch (error) {
        return {
            platform,
            status: 'denied',
            message: error instanceof Error ? error.message : 'Health background delivery could not be enabled.',
        };
    }
}
