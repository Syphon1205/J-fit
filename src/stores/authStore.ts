import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage, clearLocalDeviceData } from '../utils/Storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { OAUTH_CONFIG, resolveGoogleClientId } from '../services/oauth';
import { getOrCreateDeviceId } from '../services/deviceIdentity';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';

WebBrowser.maybeCompleteAuthSession();

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: 'google' | 'apple' | 'github' | 'guest';
    goals?: string[];
    joinedDate: string;
    height: number;
    weight: number;
    goalWeight?: number;
    fitnessGoal: 'lose_weight' | 'build_muscle' | 'stay_fit' | 'improve_endurance';
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authError: string | null;
    onboardingCompleted: boolean;
    lastAccountKey: string | null;
    deviceId: string | null;
    hasHydrated: boolean;
    initDeviceIdentity: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    loginWithGithub: () => Promise<void>;
    continueAsGuest: () => Promise<void>;
    completeOnboarding: (payload: { name: string; goals: string[]; weight?: number; goalWeight?: number; fitnessGoal?: User['fitnessGoal'] }) => void;
    updateProfile: (payload: Partial<Pick<User, 'name' | 'height' | 'weight' | 'goalWeight' | 'fitnessGoal' | 'avatar'>>) => void;
    logout: () => void;
    deleteAccount: () => Promise<void>;
    setHasHydrated: (value: boolean) => void;
}

const defaultUserProfile: User = {
    id: 'local_user',
    name: 'Cunningham Athlete',
    email: 'athlete@cunningham.local',
    joinedDate: '2025-09-15',
    height: 178,
    weight: 76,
    goalWeight: 73,
    fitnessGoal: 'build_muscle',
    provider: 'google',
};

const googleDiscovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const githubDiscovery = {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
};

const getAccountKey = (user: Pick<User, 'provider' | 'id'>) => `${user.provider}:${user.id}`;
const PERSISTED_STORE_KEYS = [
    'jfit-auth',
    'jfit-progress',
    'jfit-workouts',
    'jfit-nutrition',
    'jfit-runs',
    'jfit-notifications',
    'jfit-challenges',
    'jfit-pushups',
    'jfit-health',
    'jfit-session',
    'jfit-coaching',
    'jfit-workout-video-assessments',
    'jfit-rep-logs',
];

export const useAuthStore = create<AuthState>()(
    persist((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    authError: null,
    onboardingCompleted: false,
    lastAccountKey: null,
    deviceId: null,
    hasHydrated: false,

    initDeviceIdentity: async () => {
        const id = await getOrCreateDeviceId();
        set({ deviceId: id });
    },

    setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

    loginWithGoogle: async () => {
        set({ isLoading: true, authError: null });
        try {
            const deviceId = get().deviceId || await getOrCreateDeviceId();
            const clientId = resolveGoogleClientId();
            const redirectUri = AuthSession.makeRedirectUri({ scheme: 'jfit', path: 'oauth' });

            if (clientId.startsWith('YOUR_')) {
                set({
                    deviceId,
                    authError: 'Google sign-in needs a production OAuth client ID. Continue with local account for this device.',
                    isLoading: false,
                });
                return;
            }

            const request = new AuthSession.AuthRequest({
                clientId,
                redirectUri,
                scopes: ['openid', 'profile', 'email'],
                responseType: AuthSession.ResponseType.Token,
            });

            const result = await request.promptAsync(googleDiscovery);
            const accessToken = result.type === 'success'
                ? (result.params.access_token || result.authentication?.accessToken)
                : null;

            if (result.type === 'success' && accessToken) {
                const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                const profile = await resp.json();
                const nextUser: User = {
                    id: profile.sub,
                    name: profile.name || 'Google User',
                    email: profile.email || 'user@gmail.com',
                    avatar: profile.picture,
                    provider: 'google',
                    joinedDate: new Date().toISOString().split('T')[0],
                    height: 178,
                    weight: 76,
                    fitnessGoal: 'stay_fit',
                };
                const nextAccountKey = getAccountKey(nextUser);
                set({
                    user: nextUser,
                    isAuthenticated: true,
                    onboardingCompleted: get().onboardingCompleted,
                    lastAccountKey: nextAccountKey,
                    deviceId,
                    authError: null,
                    isLoading: false,
                });
                // Cloud Save Restore
                const cloudSave = await appStorage.getItem(`cloud_backup_${nextUser.id}`);
                if (cloudSave) {
                    try {
                        const parsed = JSON.parse(cloudSave);
                        for (const key of Object.keys(parsed)) {
                            await appStorage.setItem(key, parsed[key]);
                        }
                        if (typeof window !== 'undefined') window.location.reload();
                    } catch(e) {}
                }
            } else {
                set({ isLoading: false, authError: result.type === 'dismiss' ? null : 'Google sign-in was cancelled or failed.' });
            }
        } catch (e) {
            console.warn('Google login error', e);
            set({ isLoading: false, authError: 'Unable to sign in with Google right now.' });
        }
    },

    loginWithApple: async () => {
        set({ isLoading: true, authError: null });
        try {
            const deviceId = get().deviceId || await getOrCreateDeviceId();

            if (Platform.OS !== 'ios') {
                set({ isLoading: false, authError: 'Apple Sign In is only available on iOS devices.' });
                return;
            }

            const result = await SignInWithApple.authorize({
                clientId: 'com.cunninghamfitness.app',
                redirectURI: 'https://cunninghamfitness.com/api/auth/apple/callback',
                scopes: 'email name',
            });

            const givenName = result.response.givenName ?? '';
            const familyName = result.response.familyName ?? '';
            const fullName = `${givenName} ${familyName}`.trim() || get().user?.name || 'Apple User';
            const email = result.response.email ?? get().user?.email ?? 'user@privaterelay.appleid.com';

            const nextUser: User = {
                id: result.response.user || 'apple_local_user',
                name: fullName,
                email: email,
                provider: 'apple',
                joinedDate: new Date().toISOString().split('T')[0],
                height: 178,
                weight: 76,
                fitnessGoal: 'stay_fit',
            };
            
            const nextAccountKey = getAccountKey(nextUser);
            set({
                user: nextUser,
                isAuthenticated: true,
                onboardingCompleted: get().onboardingCompleted,
                lastAccountKey: nextAccountKey,
                deviceId,
                authError: null,
                isLoading: false,
            });

            // Cloud Save Restore
            const cloudSave = await appStorage.getItem(`cloud_backup_${nextUser.id}`);
            if (cloudSave) {
                try {
                    const parsed = JSON.parse(cloudSave);
                    for (const key of Object.keys(parsed)) {
                        await appStorage.setItem(key, parsed[key]);
                    }
                    if (typeof window !== 'undefined') window.location.reload();
                } catch(e) {}
            }
        } catch (e: any) {
            console.warn('Apple login error', e);
            if (e.message && e.message.includes('canceled')) {
                set({ isLoading: false, authError: null });
            } else {
                set({
                    isLoading: false,
                    authError: 'Please enable "Sign In with Apple" Capability in Xcode to use this feature.',
                });
            }
        }
    },

    loginWithGithub: async () => {
        set({ isLoading: true, authError: null });
        try {
            const deviceId = get().deviceId || await getOrCreateDeviceId();
            const clientId = OAUTH_CONFIG.github.clientId;
            const redirectUri = AuthSession.makeRedirectUri({ scheme: 'jfit', path: 'oauth' });

            if (!clientId || clientId.startsWith('YOUR_')) {
                set({
                    deviceId,
                    authError: 'GitHub sign-in needs a production OAuth client ID. Continue with local account for this device.',
                    isLoading: false,
                });
                return;
            }

            const request = new AuthSession.AuthRequest({
                clientId,
                redirectUri,
                scopes: ['read:user', 'user:email'],
                responseType: AuthSession.ResponseType.Code,
            });

            const result = await request.promptAsync(githubDiscovery);
            if (result.type === 'success') {
                const nextUser = {
                    ...defaultUserProfile,
                    id: `github_${result.params.code?.slice(0, 12) || deviceId}`,
                    name: 'GitHub User',
                    email: 'github-user@users.noreply.github.com',
                    provider: 'github' as const,
                };
                const nextAccountKey = getAccountKey(nextUser);
                set({
                    user: nextUser,
                    isAuthenticated: true,
                    onboardingCompleted: get().onboardingCompleted,
                    lastAccountKey: nextAccountKey,
                    deviceId,
                    authError: null,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false, authError: result.type === 'dismiss' ? null : 'GitHub sign-in was cancelled or failed.' });
            }
        } catch (e: any) {
            console.warn('GitHub login error', e);
            set({ isLoading: false, authError: 'Unable to sign in with GitHub right now.' });
        }
    },

    continueAsGuest: async () => {
        set({ isLoading: true, authError: null });
        const deviceId = get().deviceId || await getOrCreateDeviceId();
        await new Promise((r) => setTimeout(r, 300));
        const nextUser = {
            ...defaultUserProfile,
            id: `local_${deviceId}`,
            name: 'Guest',
            email: 'guest@jfit.local',
            provider: 'guest' as const,
        };
        const nextAccountKey = getAccountKey(nextUser);
        set({
            user: nextUser,
            isAuthenticated: true,
            onboardingCompleted: get().onboardingCompleted,
            lastAccountKey: nextAccountKey,
            deviceId,
            authError: null,
            isLoading: false,
        });
    },

    completeOnboarding: ({ name, goals, weight, goalWeight, fitnessGoal }) =>
        set((state) => {
            if (!state.user) return {};
            return {
                user: {
                    ...state.user,
                    name: name.trim() || state.user.name,
                    goals,
                    weight: Number.isFinite(weight) && weight && weight > 0 ? weight : state.user.weight,
                    goalWeight: Number.isFinite(goalWeight) && goalWeight && goalWeight > 0 ? goalWeight : state.user.goalWeight,
                    fitnessGoal: fitnessGoal ?? state.user.fitnessGoal,
                },
                onboardingCompleted: true,
            };
        }),

    updateProfile: (payload) =>
        set((state) => {
            if (!state.user) return {};

            return {
                user: {
                    ...state.user,
                    ...payload,
                    name: payload.name?.trim() ? payload.name.trim() : state.user.name,
                },
            };
        }),

    logout: async () => {
        // "Cloud Save" sync - Backup active stores to a user-scoped cloud string
        const user = get().user;
        if (user) {
            const backupKey = `cloud_backup_${user.id}`;
            const backupData: any = {};
            for (const key of PERSISTED_STORE_KEYS) {
                if (key === 'jfit-auth') continue;
                backupData[key] = await appStorage.getItem(key);
            }
            await appStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // Clear current active state so next user gets a fresh app
            for (const key of PERSISTED_STORE_KEYS) {
                if (key === 'jfit-auth') continue;
                await appStorage.removeItem(key);
            }
        }
        set({ user: null, isAuthenticated: false, authError: null });
        if (typeof window !== 'undefined') window.location.reload();
    },

    deleteAccount: async () => {
        const preservedDeviceId = get().deviceId || await getOrCreateDeviceId();
        await clearLocalDeviceData();
        await Promise.all(PERSISTED_STORE_KEYS.map((key) => appStorage.removeItem(key)));
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            authError: null,
            onboardingCompleted: false,
            lastAccountKey: null,
            deviceId: preservedDeviceId,
            hasHydrated: true,
        });
    },
}), {
    name: 'jfit-auth',
    storage: createJSONStorage(() => appStorage),
    partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authError: state.authError,
        onboardingCompleted: state.onboardingCompleted,
        lastAccountKey: state.lastAccountKey,
        deviceId: state.deviceId,
    }),
    onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.initDeviceIdentity();
    },
})
);
