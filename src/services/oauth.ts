import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type AppOAuth = {
    google?: {
        expoClientId?: string;
        webClientId?: string;
        iosClientId?: string;
        androidClientId?: string;
    };
    github?: {
        clientId?: string;
    };
};

const oauthFromConfig = (Constants.expoConfig?.extra?.oauth || {}) as AppOAuth;

// ─── Provider config ──────────────────────────────────────────────────────────
// Fill values via app.json > expo.extra.oauth

export const OAUTH_CONFIG = {
    google: {
        clientId: oauthFromConfig.google?.webClientId || 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
        expoClientId: oauthFromConfig.google?.expoClientId || 'YOUR_GOOGLE_EXPO_CLIENT_ID.apps.googleusercontent.com',
        iosClientId: oauthFromConfig.google?.iosClientId || 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com',
        androidClientId: oauthFromConfig.google?.androidClientId || 'YOUR_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
        // Generate at: https://console.cloud.google.com/  →  APIs & Services → Credentials
    },
    github: {
        clientId: oauthFromConfig.github?.clientId || 'YOUR_GITHUB_CLIENT_ID',
        // Generate at: https://github.com/settings/developers
    },
    strava: {
        clientId: 'YOUR_STRAVA_CLIENT_ID',
        // Generate at: https://www.strava.com/settings/api
        authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
        tokenEndpoint: 'https://www.strava.com/oauth/token',
        scopes: ['activity:read_all', 'profile:read_all'],
    },
    fitbit: {
        clientId: 'YOUR_FITBIT_CLIENT_ID',
        // Generate at: https://dev.fitbit.com/apps/new
        authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
        tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
        scopes: ['activity', 'heartrate', 'location', 'nutrition', 'profile', 'settings', 'sleep', 'weight'],
    },
    google_fit: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        // Same Google Cloud project — just add fitness scope
        scopes: [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.body.read',
            'https://www.googleapis.com/auth/fitness.heart_rate.read',
        ],
    },
    garmin: {
        clientId: 'YOUR_GARMIN_CLIENT_ID',
        // Generate at: https://developer.garmin.com/
        authorizationEndpoint: 'https://connect.garmin.com/oauthConfirm',
        tokenEndpoint: 'https://connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0',
        scopes: ['activity_export', 'health_snapshot'],
    },
};

export type OAuthProvider = keyof typeof OAUTH_CONFIG;

export function resolveGoogleClientId() {
    const platformClientId =
        Platform.OS === 'ios'
            ? OAUTH_CONFIG.google.iosClientId
            : Platform.OS === 'android'
                ? OAUTH_CONFIG.google.androidClientId
                : OAUTH_CONFIG.google.expoClientId;

    return platformClientId && !platformClientId.startsWith('YOUR_')
        ? platformClientId
        : OAUTH_CONFIG.google.expoClientId || OAUTH_CONFIG.google.clientId;
}

/** Launch OAuth flow for Strava / Fitbit / Garmin using expo-auth-session */
export async function launchOAuth(provider: 'strava' | 'fitbit' | 'garmin'): Promise<{ success: boolean; token?: string; error?: string }> {
    const cfg = OAUTH_CONFIG[provider];
    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'jfit', path: 'oauth' });

    const request = new AuthSession.AuthRequest({
        clientId: cfg.clientId,
        redirectUri,
        scopes: (cfg as any).scopes ?? [],
        responseType: AuthSession.ResponseType.Token,
    });

    try {
        const result = await request.promptAsync({
            authorizationEndpoint: (cfg as any).authorizationEndpoint,
        });

        if (result.type === 'success' && result.params.access_token) {
            return { success: true, token: result.params.access_token };
        }
        return { success: false, error: result.type };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
