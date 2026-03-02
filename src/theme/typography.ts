import { Platform } from 'react-native';

const fontFamily = Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
});

export const typography = {
    display: {
        fontSize: 34,
        fontWeight: '700' as const,
        letterSpacing: 0.37,
        lineHeight: 41,
        fontFamily,
    },
    h1: {
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: 0.36,
        lineHeight: 34,
        fontFamily,
    },
    h2: {
        fontSize: 22,
        fontWeight: '600' as const,
        letterSpacing: 0.35,
        lineHeight: 28,
        fontFamily,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: 0.38,
        lineHeight: 25,
        fontFamily,
    },
    body: {
        fontSize: 17,
        fontWeight: '400' as const,
        letterSpacing: -0.41,
        lineHeight: 22,
        fontFamily,
    },
    bodyBold: {
        fontSize: 17,
        fontWeight: '600' as const,
        letterSpacing: -0.41,
        lineHeight: 22,
        fontFamily,
    },
    callout: {
        fontSize: 16,
        fontWeight: '400' as const,
        letterSpacing: -0.32,
        lineHeight: 21,
        fontFamily,
    },
    subhead: {
        fontSize: 15,
        fontWeight: '400' as const,
        letterSpacing: -0.24,
        lineHeight: 20,
        fontFamily,
    },
    footnote: {
        fontSize: 13,
        fontWeight: '400' as const,
        letterSpacing: -0.08,
        lineHeight: 18,
        fontFamily,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as const,
        letterSpacing: 0,
        lineHeight: 16,
        fontFamily,
    },
    captionBold: {
        fontSize: 12,
        fontWeight: '700' as const,
        letterSpacing: 0.6,
        lineHeight: 16,
        fontFamily,
    },
    stat: {
        fontSize: 48,
        fontWeight: '700' as const,
        letterSpacing: -1,
        lineHeight: 52,
        fontFamily,
    },
};
