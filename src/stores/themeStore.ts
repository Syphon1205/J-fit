import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'auto';
export type UnitSystem = 'metric' | 'imperial';

interface ThemeState {
    mode: ThemeMode;
    units: UnitSystem;
    setMode: (mode: ThemeMode) => void;
    setUnits: (units: UnitSystem) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: 'dark',
    units: 'metric',
    setMode: (mode) => set({ mode }),
    setUnits: (units) => set({ units }),
}));
