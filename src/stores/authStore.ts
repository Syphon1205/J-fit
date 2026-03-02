import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { OAUTH_CONFIG } from '../services/oauth';

WebBrowser.maybeCompleteAuthSession();

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider: 'google' | 'apple';
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
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    logout: () => void;
}

const mockUser: User = {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@jfit.com',
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

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
            const clientId = OAUTH_CONFIG.google.clientId;
            const redirectUri = AuthSession.makeRedirectUri({ scheme: 'jfit', path: 'oauth' });

            // Demo mode if placeholder client ID
            if (clientId.startsWith('YOUR_')) {
                await new Promise((r) => setTimeout(r, 800));
                set({
                    user: { ...mockUser, name: 'Google User', email: 'user@gmail.com', provider: 'google' },
                    isAuthenticated: true,
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
            if (result.type === 'success' && result.params.access_token) {
                const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${result.params.access_token}` },
                });
                const profile = await resp.json();
                set({
                    user: {
                        id: profile.sub,
                        name: profile.name,
                        email: profile.email,
                        avatar: profile.picture,
                        provider: 'google',
                        joinedDate: new Date().toISOString().split('T')[0],
                        height: 178,
                        weight: 76,
                        fitnessGoal: 'stay_fit',
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            console.warn('Google login error', e);
            set({ isLoading: false });
        }
    },

    loginWithApple: async () => {
        set({ isLoading: true });
        try {
            const redirectUri = AuthSession.makeRedirectUri({ scheme: 'jfit', path: 'oauth' });
            
            // Use web-based Apple Sign-In via AuthSession (works on all platforms including Expo Go)
            const request = new AuthSession.AuthRequest({
                clientId: 'com.jfit.app',  // Must match your Bundle ID for web auth
                redirectUri,
                scopes: ['openid', 'email', 'name'],
                responseType: AuthSession.ResponseType.Token,
                usePKCE: true,
            });

            const result = await request.promptAsync({
                authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
            });

            if (result.type === 'success') {
                // Demo: In production, you'd fetch user info from the token
                set({
                    user: {
                        id: Math.random().toString(36).substr(2, 9),
                        name: 'Apple User',
                        email: 'user@privaterelay.appleid.com',
                        provider: 'apple',
                        joinedDate: new Date().toISOString().split('T')[0],
                        height: 178,
                        weight: 76,
                        fitnessGoal: 'stay_fit',
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (e: any) {
            console.warn('Apple login error', e);
            set({ isLoading: false });
        }
    },

    logout: () => set({ user: null, isAuthenticated: false }),
}));
