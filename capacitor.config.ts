import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.jfit.app',
    appName: 'Cunningham Fitness',
    webDir: 'dist',
    ios: {
        contentInset: 'always',
        limitsNavigationsToAppBoundDomains: false,
        preferredContentMode: 'mobile',
        allowsLinkPreview: false,
        scrollEnabled: false,
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#000000',
            launchFadeOutDuration: 500,
            showSpinner: false,
            launchAutoHide: true,
        },
    },
};

export default config;
