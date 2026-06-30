import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function mediumImpact(): Promise<void> {
    try {
        await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
        // Haptics are only available on supported native devices.
    }
}
