import { Capacitor, PluginListenerHandle, registerPlugin } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { TrainerMetricPayload } from './trainerSync';

type StartAdvertisingOptions = {
    payload: string;
    displayName: string;
};

type TrainerProximityPlugin = {
    startAdvertising(options: StartAdvertisingOptions): Promise<{ advertising: boolean; serviceType: string }>;
    stopAdvertising(): Promise<{ advertising: boolean }>;
    addListener(
        eventName: 'trainerProximityInvite' | 'trainerProximityConnecting' | 'trainerProximityConnected' | 'trainerProximityDisconnected',
        listenerFunc: (event: { peer: string }) => void,
    ): Promise<PluginListenerHandle>;
    addListener(
        eventName: 'trainerProximityError',
        listenerFunc: (event: { message: string }) => void,
    ): Promise<PluginListenerHandle>;
};

const NativeTrainerProximity = registerPlugin<TrainerProximityPlugin>('TrainerProximity');

export type TrainerProximityRuntime = {
    platform: string;
    isNative: boolean;
    isVirtual: boolean;
    isPhysicalIos: boolean;
    hasPlugin: boolean;
    canUseNearbySync: boolean;
    label: string;
};

export async function getTrainerProximityRuntime(): Promise<TrainerProximityRuntime> {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    const hasPlugin = Capacitor.isPluginAvailable('TrainerProximity');
    let isVirtual = platform !== 'ios';

    if (isNative && Capacitor.isPluginAvailable('Device')) {
        try {
            const info = await Device.getInfo();
            isVirtual = Boolean(info.isVirtual);
        } catch {
            isVirtual = true;
        }
    }

    const isPhysicalIos = platform === 'ios' && isNative && !isVirtual;
    const canUseNearbySync = isPhysicalIos && hasPlugin;
    const label = canUseNearbySync
        ? 'Physical iPhone ready'
        : platform !== 'ios'
            ? 'Nearby sync needs iPhone'
            : isVirtual
                ? 'Simulator preview'
                : hasPlugin
                    ? 'iPhone runtime loading'
                    : 'iOS plugin not registered';

    return { platform, isNative, isVirtual, isPhysicalIos, hasPlugin, canUseNearbySync, label };
}

export async function startTrainerProximityAdvertising(payload: TrainerMetricPayload) {
    const runtime = await getTrainerProximityRuntime();
    if (!runtime.canUseNearbySync) {
        throw new Error(runtime.isVirtual
            ? 'Nearby trainer sync is disabled in simulator and desktop previews. Test this on a physical iPhone.'
            : 'Nearby trainer sync is not registered in this iOS build. Run iOS sync and rebuild the app.'
        );
    }

    return NativeTrainerProximity.startAdvertising({
        payload: JSON.stringify(payload),
        displayName: payload.athlete.name,
    });
}

export async function stopTrainerProximityAdvertising() {
    const runtime = await getTrainerProximityRuntime();
    if (!runtime.canUseNearbySync) return;
    await NativeTrainerProximity.stopAdvertising().catch(() => undefined);
}

export function isTrainerProximityAvailable() {
    return Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('TrainerProximity');
}

export async function listenToTrainerProximity(listener: (event: { type: string; peer?: string; message?: string }) => void) {
    const runtime = await getTrainerProximityRuntime();
    if (!runtime.canUseNearbySync) return [];

    const handles = await Promise.all([
        NativeTrainerProximity.addListener('trainerProximityInvite', ({ peer }) => listener({ type: 'invite', peer })),
        NativeTrainerProximity.addListener('trainerProximityConnecting', ({ peer }) => listener({ type: 'connecting', peer })),
        NativeTrainerProximity.addListener('trainerProximityConnected', ({ peer }) => listener({ type: 'connected', peer })),
        NativeTrainerProximity.addListener('trainerProximityDisconnected', ({ peer }) => listener({ type: 'disconnected', peer })),
        NativeTrainerProximity.addListener('trainerProximityError', ({ message }) => listener({ type: 'error', message })),
    ]).catch(() => []);

    return handles;
}
