import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'jfit-device-id';

const createId = () => {
    const rand = Math.random().toString(36).slice(2, 10);
    return `device_${Date.now().toString(36)}_${rand}`;
};

export async function getOrCreateDeviceId(): Promise<string> {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const id = createId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    return id;
}
