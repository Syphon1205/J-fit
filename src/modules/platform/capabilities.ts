import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface PlatformCapabilities {
    platform: 'ios' | 'android' | 'web' | 'unknown';
    supportsNativeAppleAuth: boolean;
    supportsLiveActivities: boolean;
    supportsOnDeviceVision: boolean;
    supportsHealthPlatform: boolean;
    requiresPrebuildForPremium: boolean;
}

export function getPlatformCapabilities(): PlatformCapabilities {
    const platform =
        Platform.OS === 'ios'
            ? 'ios'
            : Platform.OS === 'android'
                ? 'android'
                : Platform.OS === 'web'
                    ? 'web'
                    : 'unknown';

    const isExpoGo = Constants.appOwnership === 'expo';

    return {
        platform,
        supportsNativeAppleAuth: platform === 'ios' && !isExpoGo,
        supportsLiveActivities: platform === 'ios' && !isExpoGo,
        supportsOnDeviceVision: platform === 'ios' || platform === 'android',
        supportsHealthPlatform: platform === 'ios' || platform === 'android',
        requiresPrebuildForPremium: platform === 'ios' ? isExpoGo : false,
    };
}
