import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../utils/Storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'dark' | 'light' | 'auto';
export type UnitSystem = 'metric' | 'imperial';
export type ThemePreset = 'noir' | 'classic' | 'punchy' | 'earthy' | 'studio' | 'solar';

interface ThemeState {
    mode: ThemeMode;
    units: UnitSystem;
    preset: ThemePreset;
    hapticsEnabled: boolean;
    liveWeatherEnabled: boolean;
    reducedMotion: boolean;
    setMode: (mode: ThemeMode) => void;
    setUnits: (units: UnitSystem) => void;
    setPreset: (preset: ThemePreset) => void;
    setHapticsEnabled: (enabled: boolean) => void;
    setLiveWeatherEnabled: (enabled: boolean) => void;
    setReducedMotion: (enabled: boolean) => void;
}

const applyColorScheme = (mode: ThemeMode) => {
    const colorScheme = mode === 'auto' ? null : mode;

    if (typeof Appearance?.setColorScheme === 'function') {
        Appearance.setColorScheme(colorScheme);
    }

    if (typeof document !== 'undefined') {
        document.documentElement.style.colorScheme = colorScheme ?? 'normal';
    }
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'light',
            units: 'metric',
            preset: 'noir',
            hapticsEnabled: true,
            liveWeatherEnabled: true,
            reducedMotion: false,
            setMode: (mode) => {
                applyColorScheme(mode);
                set({ mode });
            },
            setUnits: (units) => set({ units }),
            setPreset: (preset) => set({ preset }),
            setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
            setLiveWeatherEnabled: (liveWeatherEnabled) => set({ liveWeatherEnabled }),
            setReducedMotion: (reducedMotion) => set({ reducedMotion }),
        }),
        {
            name: 'jfit-theme',
            storage: createJSONStorage(() => appStorage),
            partialize: (state) => ({
                mode: state.mode,
                units: state.units,
                preset: state.preset,
                hapticsEnabled: state.hapticsEnabled,
                liveWeatherEnabled: state.liveWeatherEnabled,
                reducedMotion: state.reducedMotion,
            }),
            onRehydrateStorage: () => (state) => {
                applyColorScheme(state?.mode ?? 'light');
            },
        }
    )
);
