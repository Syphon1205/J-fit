import AsyncStorage from '@react-native-async-storage/async-storage';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

const DEVICE_KEY = 'cunningham_device_id';

let cachedDeviceId: string | null = null;

const fallbackId = () => {
    try {
        const existing = globalThis.localStorage?.getItem(DEVICE_KEY);
        if (existing) return existing;
        const next = `web_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
        globalThis.localStorage?.setItem(DEVICE_KEY, next);
        return next;
    } catch {
        return `web_device_${Date.now().toString(36)}`;
    }
};

export async function getDeviceNamespace(): Promise<string> {
    if (cachedDeviceId) return cachedDeviceId;
    try {
        const saved = await Preferences.get({ key: DEVICE_KEY });
        if (saved.value) {
            cachedDeviceId = saved.value;
            return cachedDeviceId;
        }
    } catch {
        // Fall through to Device.getId.
    }
    try {
        const info = await Device.getId();
        cachedDeviceId = info.identifier || fallbackId();
        await Preferences.set({ key: DEVICE_KEY, value: cachedDeviceId }).catch(() => undefined);
        return cachedDeviceId;
    } catch {
        cachedDeviceId = fallbackId();
        await Preferences.set({ key: DEVICE_KEY, value: cachedDeviceId }).catch(() => undefined);
        return cachedDeviceId;
    }
}

export function getCachedDeviceNamespace(): string {
    if (cachedDeviceId) return cachedDeviceId;
    cachedDeviceId = fallbackId();
    return cachedDeviceId;
}

export function namespacedKey(key: string): string {
    if (key.startsWith('cunningham_')) return key;
    return `cunningham_${getCachedDeviceNamespace()}_${key}`;
}

function normalizeStoredValue(value: string | null | undefined): string | null {
    if (!value || value === 'undefined' || value === 'null') return null;
    try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) return null;
        return value;
    } catch {
        return null;
    }
}

export const appStorage = {
    async getItem(name: string): Promise<string | null> {
        const scoped = namespacedKey(name);
        const nativeValue = normalizeStoredValue((await Preferences.get({ key: scoped }).catch(() => ({ value: null }))).value);
        if (nativeValue) return nativeValue;
        const scopedValue = normalizeStoredValue(await AsyncStorage.getItem(scoped));
        if (scopedValue) {
            await Preferences.set({ key: scoped, value: scopedValue }).catch(() => undefined);
            return scopedValue;
        }
        const legacyValue = normalizeStoredValue(await AsyncStorage.getItem(name));
        if (legacyValue) {
            await Preferences.set({ key: scoped, value: legacyValue }).catch(() => undefined);
            await AsyncStorage.setItem(scoped, legacyValue);
            return legacyValue;
        }
        return null;
    },
    async setItem(name: string, value: string): Promise<void> {
        const scoped = namespacedKey(name);
        await Preferences.set({ key: scoped, value }).catch(() => undefined);
        await AsyncStorage.setItem(scoped, value);
    },
    async removeItem(name: string): Promise<void> {
        const scoped = namespacedKey(name);
        await Preferences.remove({ key: scoped }).catch(() => undefined);
        await Preferences.remove({ key: name }).catch(() => undefined);
        await AsyncStorage.removeItem(scoped);
        await AsyncStorage.removeItem(name);
    },
};

export async function clearLocalDeviceData(): Promise<void> {
    const namespace = `cunningham_${await getDeviceNamespace()}_`;
    const keys = await AsyncStorage.getAllKeys();
    const nativeKeys = await Preferences.keys().catch(() => ({ keys: [] }));
    await Promise.all(nativeKeys.keys.filter((key) => key.startsWith(namespace)).map((key) => Preferences.remove({ key }).catch(() => undefined)));
    await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(namespace)));
}

export async function clearAppCache(): Promise<number> {
    const namespace = `cunningham_${await getDeviceNamespace()}_`;
    const keys = await AsyncStorage.getAllKeys();
    const nativeKeys = await Preferences.keys().catch(() => ({ keys: [] }));
    const allKeys = Array.from(new Set([...keys, ...nativeKeys.keys]));
    const cacheKeys = allKeys.filter((key) => {
        const scoped = key.startsWith(namespace);
        const normalized = key.toLowerCase();
        return scoped && (
            normalized.includes('cache') ||
            normalized.includes('weather') ||
            normalized.includes('geocode') ||
            normalized.includes('route-preview') ||
            normalized.includes('asset')
        );
    });
    if (cacheKeys.length > 0) {
        await Promise.all(cacheKeys.map((key) => Preferences.remove({ key }).catch(() => undefined)));
        await AsyncStorage.multiRemove(cacheKeys);
    }
    return cacheKeys.length;
}
